document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //send email upon clikcing "submit"
  document.querySelector('#send-email').addEventListener('click', () => send_email());

  // By default, load the inbox
  load_mailbox('inbox');
});

function send_email() {

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;


  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      if (result.error) {
        console.log(result);
      }
      else {
        load_mailbox('sent');
      }
  //needed for forms - wants to go to a path if don't specify to stop there    
  return false;
  });
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function reply_email(email) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail').style.display = 'none';

  //add reply all function
  document.querySelector('#compose-recipients').value = email.sender;
  if(email.subject.indexOf("Re:") === -1) {
    email.subject = "Re: "+email.subject;
  }
  document.querySelector('#compose-subject').value = email.subject;
  document.querySelector('#compose-body').value = `\n\nOn ${email.timsetamp} ${email.sender} wrote: \n \n${email.body}`;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //load emails to display
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      emails.forEach(email => show_email(email, mailbox));
  });
}

function show_email(email, mailbox) {
  //create div(will add to it), and store it in a variable
  const email_display = document.createElement('div');
  email_display.id = 'email';
  email_display.className = 'row';

  //create new div to display recipient, add it to the 'main' div
  const recipient = document.createElement('div');
  recipient.id = 'email-recipient';
  recipient.className = "col-lg-6 col-md-9 col-sm-30";
  console.log(`Mailbox: ${mailbox}`);
  if (mailbox === 'inbox') {
    recipient.innerHTML = email.sender;
  }
  else {
    //test without the [0] - not clear why
    recipient.innerHTML = email.recipients;
  }
  email_display.append(recipient);

  //create new div to display subject, add it to the 'main' div
  const subject = document.createElement('div');
  subject.id = 'email-subject';
  subject.className = "col-lg-2 col-md-3 col-sm-12";
  subject.innerHTML = email.subject;
  email_display.append(subject);

  //create new div to display timestamp, add it to the 'main' div
  const timestamp = document.createElement('div');
  timestamp.id = 'email-timestamp';
  timestamp.className = "col-lg-2 col-md-3 col-sm-12";
  timestamp.innerHTML = email.timestamp;
  email_display.append(timestamp);

  //create archive button, add it to the 'main' div
  console.log(mailbox);
  if (mailbox !== 'sent') {
    const archive_button = document.createElement('BUTTON');
    archive_button.innerHTML = "Archive Email"
    email_display.append(archive_button);
    archive_button.addEventListener('click', () => update_archive(email.id, email.archived));
  }

  //create div that responds to whehter email is read. Append the div created to this div, so now the whole thing responds (try it the other way around as a test)
  const email_card = document.createElement('div');
  email_card.id = 'email-read'
  if (email.read){
    email_card.className = 'read email';
  }
  else {
    email_card.className = 'not-read email';
  }
  email_card.append(email_display);

  //add click event to take to individual emails
  email_card.addEventListener('click', () => view_email(email.id));

  //append the email card to the html view
  document.querySelector('#emails-view').append(email_card);
}

function view_email(email_id) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'block';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      mark_email_read(email_id);
      console.log(email);
      document.querySelector('#email-view-sender').innerHTML = email.sender;
      document.querySelector('#email-view-recipients').innerHTML = email.recipients;
      document.querySelector('#email-view-subject').innerHTML = email.subject;
      document.querySelector('#email-view-timestamp').innerHTML = email.timestamp;
      document.querySelector('#email-view-body').innerHTML = email.body;
      //activate reply button
      document.getElementById('reply-email-button').addEventListener('click', () => reply_email(email));
  });

  return false;
}

function mark_email_read(email_id) {
  console.log('update email as read = true');
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: body = JSON.stringify({
      read: true
    })
  })
}

function update_archive(email_id, archive_status) {
  const new_archive_value = !archive_status;
  console.log(`updating email as archived = ${new_archive_value}`);
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: body = JSON.stringify({
      archived: new_archive_value
    })
  })
  load_mailbox('inbox');
  window.location.reload();

}