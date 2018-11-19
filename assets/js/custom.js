function closenav(){
	$('#collapse').animate({width: 'toggle'});
	if($('#burger').attr('class') == 'fa fa-bars') {
			$('.fa-bars').attr('class','fa fa-close');
		} 
		else {
			$('#burger').attr('class','fa fa-bars');
			}
}