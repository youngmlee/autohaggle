$(document).ready(function(){

  $('span.text select').change(function(){
    $(this).siblings('.value').text($(this).find('option[value="'+$(this).val()+'"]').text());
  });

  for ( make in cars )
  {
    $('#formmake').append('<option value="'+make+'">'+make+'</option>');
  }

  $('#formmake').change(function(){
    const val = $(this).val();
    $('#formmodel').html('<option value="">Select Model</option>');
    for ( i in cars[val] )
    {
      $('select').material_select();
      $('#formmodel').append('<option value="'+cars[val][i]+'">'+cars[val][i]+'</option>');
    }
  });

  $('#formmodel').change(function(){
    const modelVal = $(this).val();
    $('#formtrim').html('<option value="">Select Trim</option>');
    for ( i in trims[modelVal] )
    {
      $('select').material_select();
      $('#formtrim').append('<option value="'+trims[modelVal][i]+'">'+trims[modelVal][i]+'</option>');
    }
  });

  $('#formmake, span.text select').each(function(){
    const def = $(this).siblings('.value').text();
    if (def !== '') {
      $(this).find('option[value='+def+']').attr('selected', 'selected');
      $(this).change();
    }
  });
});

$(document).ready(function() {
  $('select').material_select();
});

$('#myform').submit(function(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const data = JSON.stringify({
    email: formData.get('email'),
    demail: getRecipientsArr([formData.get('demail1'), formData.get('demail2'), formData.get('demail3'), formData.get('demail4'), formData.get('demail5'), formData.get('demail6')]),
    year: formData.get('year'),
    make: formData.get('make'),
    model: formData.get('model'),
    trim: formData.get('trim'),
    color: formData.get('color'),
    financing: formData.get('financing'),
    credit: formData.get('credit'),
    city: formData.get('city'),
    details: formData.get('details')
  })
  event.target.reset()

  fetch('/autohaggle', {
    method: 'POST',
    body: data,
    headers: { 'content-type': 'application/json'}
  })

  alert('Form submitted!')
})

function getRecipientsArr(demail) {
  let recipientsArr = []
  for (let i = 0; i < demail.length; i++) {
    let recipient = demail[i]
    if (recipient.trim()) {
      recipientsArr.push(recipient)
    }
  }
  return recipientsArr
}
