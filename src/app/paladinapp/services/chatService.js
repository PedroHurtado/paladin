'use strict';


angular.module('paladinApp')
    .service('chatService', [
        '$rootScope',
        'appStateManager',
        'apiService',
        'enums',
        '$base64',
        'toastService',
        function ($rootScope,
                  appStateManager,
                  apiService,
                  enums,
                  $base64,
                  toastService) {

            const self = this;
            self.CHAT_HASH = 'ZDA1YWM1NTY2MWUyNzY2M2MwMjVhY2E3MDQ3YzgyNTkwOGFlMTU2MjpQYWxhZGluXzEyMzEyMzEyMw==';
            self.userDialogs = {};
            if (window.globals.isProd()) {
                self.kApplicationID = 48979;
                self.kAuthKey = "s64NxQBAMrmGYXz";
                self.kAuthSecret = "wxqqXZAfdYpsEvd";
                self.kAccountKey = "7awzEayyEjqP2LQuppJj";
            } else {
                self.kApplicationID = 58169;
                self.kAuthKey = "u3n3guWwktMpCsU";
                self.kAuthSecret = "yV26WrfkrBMZC2n";
                self.kAccountKey = "7awzEayyEjqP2LQuppJj";
            }


            const onMessage = (userId, message) => {
                // This is a notification about dialog creation
                if (message && message.body) {
                    let msg = message;
                    msg.isMe = userId == self.chatUser.id;
                    msg.message = message.body;
                    msg._id = message.id;
                    if (msg.message === 'attachment' && msg.extension && msg.extension.attachments && msg.extension.attachments.length > 0) {
                        msg.message = '';
                        msg.img = QB.content.privateUrl(msg.extension.attachments[0].uid);
                    }
                    $rootScope.$emit(enums.busChatEvents.newMessage,msg);
                }
            };

            const onDisconnectedListener = () => {
                console.warn('onDisconnectedListener')
            };

            const onReconnectListener = () => {
                console.warn('onReconnectListener')
            };

            const init = () => {
                QB.init(self.kApplicationID,self.kAuthKey,self.kAuthSecret,{
                    debug: { mode: window.globals.isProd() ? 0 : 1 },
                    chatProtocol: {
                        active: 2// set 1 to use BOSH, set 2 to use WebSockets (default)
                    },
                });
                QB.chat.onDisconnectedListener = onDisconnectedListener;
                QB.chat.onReconnectListener = onReconnectListener;
                QB.chat.onMessageListener = onMessage;
                getAppSession();

            };

            const getAppSession = () => {
                return new Promise((resolve,reject) => {
                    if (self.chatAppSession) {
                        resolve(self.chatAppSession)
                    } else {
                        QB.createSession(function (err, result) {
                            // callback function
                            console.log(err, result);
                            if (result && result.token) {
                                self.chatAppSession = result;
                                resolve(result)
                            } else {
                                reject('could not create app session')
                            }
                        });
                    }
                })
            };

            const getUserParams = () => {
                const password = $base64.decode(self.CHAT_HASH).split(':')[1];
                const {user} = appStateManager;
                const {User_Email, User_FacebookId, User_UserName} = user;
                if (User_FacebookId != undefined && User_FacebookId != '') { // facebook user
                    return {
                        login: User_FacebookId,
                        password
                    }
                } else { // manual user
                    return {
                        login: User_UserName,
                        password,
                    };
                }

            };

            const loginToChat = () => {
                // Probably open a socket?
                return new Promise((resolve,reject) =>  {
                    getAppSession()
                        .then((session) => {
                            let params = {
                                ...getUserParams(),
                                token: session.token,
                            };
                            QB.login(params,(err,user) => {
                                if (err) {
                                    if (err.code === 401) { // user doesn't exist in QB, create instead
                                        signupToChat().then(resolve).catch(reject)
                                    } else {
                                        reject(err);
                                    }
                                } else {
                                    self.chatUser = user;
                                    resolve(user);
                                    syncQbUserId()
                                }
                            })
                        })
                        .catch(reject)
                })
            };

            const signupToChat = () => {
                return new Promise((resolve,reject) => {
                    getAppSession()
                        .then((session) => {
                            let params = {
                                ...getUserParams(),
                                token: session.token
                            };

                            QB.users.create(params, function (err, user) {
                                console.log(err, user);
                                if (user) {
                                    // success
                                    self.chatUser = user;
                                    resolve(user);
                                    syncQbUserId()
                                } else {
                                    // error
                                    reject(err)
                                }
                            });
                        })
                        .catch(reject)
                })
            };


            const connectToChat = () => { // socket
                return new Promise((resolve, reject) => {
                    getAppSession()
                        .then((session) => {
                            const params = {
                                ...getUserParams(),
                                token: session.token
                            };
                            QB.createSession(params,(err,result) => {
                                if (result) {
                                    self.userToken = result.token;
                                    QB.chat.connect({
                                        userId: self.chatUser.id,
                                        password:params.password
                                    }, (err2,res) => {
                                        if (!err2) {
                                            //   Connected to socket
                                            resolve(res);
                                            if (self.pendingChatToJoin) {
                                                $rootScope.$emit(enums.busChatEvents.selectPendingChat,{chatId: self.pendingChatToJoin});
                                                self.pendingChatToJoin = undefined;
                                            }
                                        } else {
                                            reject(err2)
                                        }
                                    })
                                } else {
                                    reject(err)
                                }
                            })
                        })
                        .catch(reject)
                })
            };

            const syncDialogList = () => {
                return new Promise((resolve,reject) => {
                    QB.chat.dialog.list(null,(err,result) => {
                        if (result) {
                            result.items.forEach((item) => {
                                self.userDialogs[item._id] = self.userDialogs[item._id] || 0
                            });
                            getUnreadMessage()
                                .then(resolve)
                                .catch(reject)
                        } else {
                            reject(err)
                        }
                    })
                })
            };

            const syncQbUserId = () => {
                apiService.users.editProfile({
                    User_QBId: self.chatUser.id,
                    User_Id: appStateManager.getUserId(),
                })
                    .then((res) => console.log('SUCCESSFULLY UPDATED PROFILE'))
                    .catch((err) => console.error('ERROR UPDATING PROFILE'));
            };

            const disconnectChat = () => {
                QB.chat.disconnect()
            };

            const createOrStartChat = ({
                                           lenderId,
                                           borrowerId,
                                           lenderQBId,
                                           borrowerQBId,
                                           productId,
                                           productName,
                                           chatRoomId = null,
                                           bookingId = null,
                                       }) => {
                /**
                 * lenderQbId: '=',
                 lenderId: '=',
                 borrowerQbId: '=',
                 borrowerId: '=?',
                 productId: '=',
                 bookingId: '=?',
                 */

                /**
                 *  {
                      "User_UDID": "sample string 1",
                      "User_UDIDType": 2,
                      "Borrower_Id": 3,
                      "Lender_Id": 4,
                      "Product_Id": 5,
                      "MeetingTime": "sample string 6",
                      "Chat_QBRoomId": "sample string 7",
                      "LanguageCode": "sample string 8",
                      "BookingId": 9
                    }
                 */
                return new Promise((resolve,reject) => {
                        if (chatRoomId) {
                            // chat exists, fetch from server
                            apiService.chats
                                .startBookingChat({
                                    lenderId,
                                    borrowerId,
                                    productId,
                                    chatRoomId,
                                    bookingId,
                                })
                                .then((res) => {
                                    resolve(res.Data);
                                })
                                .catch((err) => {
                                    reject(err);
                                })

                        } else {
                            // chat doesn't exist, create in QB and link with server
                            let params = {
                                name: productName,
                                type: 2, //group chat,
                                occupants_ids: [lenderQBId,borrowerQBId],
                            };
                            QB.chat.dialog.create(params, (err,result) => {
                                    if (err) {
                                        reject(err)
                                    } else {
                                        const dialogId = result._id;
                                        apiService.chats
                                            .startBookingChat({
                                                lenderId,
                                                borrowerId,
                                                productId,
                                                chatRoomId: dialogId,
                                                bookingId,
                                            })
                                            .then((res) => {
                                                resolve(res.Data)
                                            })
                                            .catch((err) => {
                                                result(err)
                                            })
                                    }
                            });
                        }
                })
            };


            const setUserTyping = (userId, isTyping) => {
                return new Promise((resolve => {
                    resolve(`${userId} is now ${isTyping ? 'Typing..' : 'Idle'}`)
                }))
            };

            const uploadMedia = (inputElement) => {
                return new Promise((resolve => {
                    resolve('Media file uploaded!')
                }));
            };

            const getDialogsList = () => {
                  return new Promise((resolve,reject) => {

                  })
            };

            const getChatList = (userId,pageIndex = 0) => {
                return new  Promise((resolve,reject) => {
                    // let arr = [];
                    // let index = 0;
                    // while (arr.length < 30 && pageIndex < 40) {
                    //     arr.push({
                    //         Chat_Id: new Date().getTime() + index++,
                    //         Product_Title: 'My Product',
                    //
                    //         recipient: 'John Smith',
                    //         borrowerName: 'Samer Murad',
                    //         thumbnail: 'tofyk5Tv55ghu7pacsjz5a4stKjQj',
                    //     })
                    // }
                    // setTimeout(() => resolve(arr),500);
                    // return;
                    apiService.chats.getChatsList({
                        userId,
                        pageIndex,
                    })
                        .then((res) => {
                            if (res.Data) {
                                // resolve(res.Data);
                                let lists = res.Data.Chat_Borrow.concat(res.Data.Chat_Lent).map((item) => {
                                    item.thumbnail = item.Lender_UserId == appStateManager.user.User_Id ?  item.Borrower_ProfileImage : item.Lender_ProfileImage;
                                    item.recipient = item.Lender_UserId == appStateManager.user.User_Id ?   item.Borrower_FullName : item.Lender_FullName;
                                    item.initialBadge = (self.userDialogs || {})[item.Chat_QBRoomId] || 0;
                                    item.lastUpdatedDate = new Date(item.ChatLastUpdated);
                                    item.isLent = item.Lender_UserId == appStateManager.user.User_Id;
                                    return item;
                                });
                                lists = lists.sort((a,b) => a.lastUpdatedDate - b.lastUpdatedDate);
                                resolve(lists);
                                if (self.pendingChatToJoin) {
                                    $rootScope.$emit(enums.busChatEvents.selectPendingChat,{chatId: self.pendingChatToJoin});
                                    self.pendingChatToJoin = undefined;
                                }
                            } else
                                reject(Error('No data'))
                        })
                        .catch(reject)
                })
            };

            const getChatDetailed = (chatQbId) => {
                return new Promise((resolve,reject) => {
                    apiService.chats.getChatByQBId({chatQbId})
                        .then((res) => resolve(res.Data))
                        .catch(reject)
                })
            };

            const getChatHistory = (dialogId,skip = 0) => {
                return new Promise((resolve,reject) => {
                        // let arr = [];
                        // let index = 0;
                        // while (arr.length < 4) {
                        //     arr.push({
                        //         message: 'This is test message',
                        //         isMe: index % 3 == 0,
                        //         thumbnail: 'tofyk5Tv55ghu7pacsjz5a4stKjQj',
                        //         img: index == 3 ? 'https://picsum.photos/800/1300/?random' : undefined,
                        //         isSent: true,
                        //         _id: new Date().getTime() + index++
                        //     })
                        // }
                        // setTimeout(() => {
                        //     resolve(arr)
                        // },500)
                    QB.chat.message.list({chat_dialog_id: dialogId,skip: skip,limit:10,sort_desc:'date_sent'},(err,result) => {
                        if (err)
                            reject(err);
                        else {
                            const msgs = result.items.map((item) => {
                                item.isMe = item.sender_id == self.chatUser.id;
                                item.thumbnail = 'tofyk5Tv55ghu7pacsjz5a4stKjQj';
                                item.dateSent = new Date(item.date_sent * 1000);
                                if (item.message === 'attachment' && item.attachments && item.attachments.length > 0) {
                                    item.message = '';
                                    item.img = QB.content.privateUrl(item.attachments[0].uid);
                                }
                                return item
                            });
                            resolve(msgs.reverse());
                        }
                    })

                })
            };

            const joinChat = (dialogId) => {
                const chatDialog = QB.chat.helpers.getRoomJidFromDialogId(dialogId);
                return new Promise((resolve,reject) => {
                    QB.chat.muc.join(chatDialog,function(presence) {
                        resolve()
                    })
                })
            };

            const leaveChat = (dialogId) => {
                const chatDialog = QB.chat.helpers.getRoomJidFromDialogId(dialogId);
                return new Promise((resolve,reject) => {
                    QB.chat.muc.leave(chatDialog,function(presence) {
                            resolve()
                    })
                })
            };

            const sendMessage = ({dialogId, text,productId, input /* inputElement (Optional) */}) => {
                return new Promise((resolve,reject) => {
                    const chatDialog = QB.chat.helpers.getRoomJidFromDialogId(dialogId);
                    if( input && input.files.length > 0) { // is File
                        const inputFile = input.files[0];
                        let params = {name: inputFile.name, file: inputFile, type: inputFile.type, size: inputFile.size, 'public': false};
                        QB.content.createAndUpload(params, function(err, res) {
                            if (err) {
                                console.error(err);
                                reject(err);
                            } else {
                                const fileUID = res.uid;
                                // prepare a message
                                let msg = {
                                    type: 'groupchat',
                                    body: "attachment",
                                    ProductId: productId,
                                    extension: {
                                        save_to_history: 1,
                                        attachments: [ {uid: fileUID , type: 'photo'} ],
                                        ProductId: productId,
                                        dialogID: dialogId,
                                        isBot: '0'
                                    },
                                    markable: 1
                                };
                                QB.chat.send(chatDialog,msg);
                                resolve()
                            }
                        });
                    } else {

                        QB.chat.send(chatDialog, {
                            type: 'groupchat',
                            body: text,
                            extension: {
                                save_to_history: 1,
                                ProductId: productId,
                                dialogID: dialogId,
                                isBot: '0'
                            },
                            markable: 1,
                        });
                        resolve()
                    }
                })
            };


            const notifyUser = ({
                                     userId,
                                     dialogId,
                                     isNewChat = false,
                                 }) => {
                return new Promise((resolve,reject) => {
                        let msg = {
                            type: 'chat',
                            extension: {
                                notification_type: isNewChat? 1 : 2,
                                _id: dialogId,
                            },
                        };

                        QB.chat.send(userId, msg);
                    resolve();
                });
            };

            const getUnreadMessage = () => {
                return new Promise((resolve,reject) => {
                    const dialogIds = Object.keys(self.userDialogs);
                    Promise.all(
                        dialogIds.map((key) => getUnreadMessagesForDialogId(key))
                    )
                        .then((results) => {
                            results.forEach((item) => {
                                self.userDialogs[item.dialogId] = item.count || 0
                            });
                            resolve(self.userDialogs)
                        })
                        .catch((err) => {
                            reject(err)
                        });
                });
            };

            const getUnreadMessagesForDialogId = (dialogId) => {
                  return new Promise((resolve) => {
                      QB.chat.message.unreadCount({chat_dialog_ids: dialogId},(err,res) => {
                          if (err)
                              resolve(0);
                          else {
                              resolve({
                                  dialogId: dialogId,
                                  count: (res || {})[dialogId] || 0
                              });
                          }
                      })
                  })
            };
            const getTotalUnreadCount = () => {
                return new Promise((resolve => {
                    QB.chat.message.unreadCount(null,(err,res) => {
                        if (err)
                            resolve(0);
                        else {
                            resolve(res);
                        }
                    })
                }))
            } ;

            const clearUnreadBadgesForDialog = (dialogId) => {
                self.userDialogs[dialogId] = 0;
                let numberOfUnreadMessages = 0;
                Object.keys(self.userDialogs)
                    .forEach((dialog) => {
                        numberOfUnreadMessages += self.userDialogs[dialog];
                    });
                $rootScope.$emit(enums.busChatEvents.updateUnreadCount,{
                    total: numberOfUnreadMessages,
                    detailedDict: self.userDialogs,
                })
            };

            const activateChatWhenReady = (dialogId) => {
                self.pendingChatToJoin = dialogId
            };

            return {
                init,
                loginToChat,
                createOrStartChat,
                setUserTyping,
                uploadMedia,
                getChatList,
                getChatDetailed,
                getChatHistory,
                signupToChat,
                connectToChat,
                disconnectChat,
                syncDialogList,
                sendMessage,
                joinChat,
                leaveChat,
                notifyUser,
                getUnreadMessage,
                clearUnreadBadgesForDialog,
                activateChatWhenReady
            }
    }]);