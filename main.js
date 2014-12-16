var gmail;

function refresh(f) {
  if(/in/.test(document.readyState)) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}

function findField(type) {
  // type must be of 'bcc' or 'cc'
  var field = $('textarea[name="' + type + '"]');
  if (field.length > 0) {
    var focusedElem = document.activeElement;

    // Only populate if the field is not already in focus (otherwise, it can
    // become very hard to edit)
    if (focusedElem !== field.get(0)) {
      return field;
    }
    focusedElem.focus();
  }
  setTimeout(findField(type), 500);
}

function populateField(type, field, email) {
    // If field is not visible, then simulate click to make it so
    if (!field.is(':visible')) {
      console.log('field is not visible', type);
      if (type === 'bcc') {
        $('span:contains("Add Bcc")').click();
      } else if (type === 'cc') {
        $('span:contains("Add Cc")').click();
      }
    }

    // Add email to field, if not already in there
    var fieldElement = field.get(0);
    if (fieldElement.value) {
      if (fieldElement.value.indexOf(email) === -1) {
        fieldElement.value += ', ' + email;
      }
    } else {
      fieldElement.value = email;
    }
}

function clearField(field, email) {
  var fieldElement = field.get(0);
  if (fieldElement.value) {
    if (fieldElement.value.indexOf(email) !== -1) {
      fieldElement.value = FieldElement.value.replace(email, "").
        replace(/^,?\s*/, "");
    }
  }
}

function waitForCompose(fn, args) {
  console.log('waiting for compose...');
  toField = findField('to');
  if (toField.is(':visible')) {
    fn.apply(args);
  } else {
    setTimeout(waitForCompose(fn, args), 1000);
  }
}

function swapToBcc(from_email, cc_email) {
  console.log('swapping bcc!');
  console.log(from_email, cc_email);

  bccField = findField('bcc');
  ccField = findField('cc');
  toField = findField('to');

  // from => bcc, cc => to
  populateField('bcc', bccField, from_email);
  populateField('to', toField, cc_email);
  clearField(ccField, cc_email);
  clearField(toField, from_email);
}

var main = function(){
  gmail = new Gmail();
  user_email = gmail.get.user_email();

  gmail.observe.on("compose", function(compose, type) {
    if (type === "reply") {
      email_data = gmail.get.email_data();

      // Assume that you're replying from the last email. There's no actual
      // way to tell which email you replied to. ):
      last_email = email_data.threads[email_data.last_email];

      from_email = last_email.from_email
      cc_email = last_email.cc[0]

      // If there's no cc, check the to line for anything that's not your
      // email.
      if (cc_email === undefined) {
        to_emails = last_email.to
        for (var i = 0; i < to_emails.length; i++) {
          to_email = to_emails[i];
          if (!to_email.match(user_email)) {
            cc_email = to_email;
            break;
          }
        }
      }

      console.log('eh?');
      //waitForCompose(swapToBcc, [from_email, cc_email]);
      setTimeout(swapToBcc, 1000, from_email, cc_email);
    }
  });
}


refresh(main);
