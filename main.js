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

function clickBccButton() {
  elements = $('span:contains("Bcc")');
  for (var i = 0; i < elements.length; i++) {
    el = elements[i];
    aria_label = el.getAttribute('aria-label')
    if (aria_label != null && aria_label.match('Add Bcc')) {
      $(el).click();
    }
  }
}

function removeExisting(email) {
  element = $($('.vR .vN')[0]);
  if (element != undefined) {
    element = $(element);
    if (element.attr('email') === email) {
      element.find('.vM').click();
    }
  }
}

function populateField(field, email) {
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
      fieldElement.value = fieldElement.value.replace(email, "").
        replace(/^,?\s*/, "");
    }
  }
}

function swapToBcc(from_email, cc_email) {
  console.log('swapping to bcc!');
  console.log(from_email, cc_email);

  removeExisting(from_email);

  bccField = findField('bcc');
  ccField = findField('cc');
  toField = findField('to');

  // from => bcc, cc => to
  populateField(bccField, from_email);
  populateField(toField, cc_email);
  clearField(ccField, cc_email);
  clearField(toField, from_email);

  clickBccButton();
}

function findRepliedToThread(composeElement) {
  // Many parents up ...
  threadElement = composeElement.$el.parent().parent().parent().parent();

  whitelistedClasses = ['ii', 'gt', 'adP', 'adO'];
  classes = threadElement.find('.adP.adO').attr('class').split(' ');
  threadId = undefined;
  for (var i = 0; i < classes.length; i++) {
    currentClass = classes[i];
    if (whitelistedClasses.indexOf(currentClass) === -1) {
      // The format of the class is mTHREAD_ID, so slice off the first char.
      threadId = currentClass.slice(1);
      return threadId;
    }
  }
}

var main = function(){
  gmail = new Gmail();
  user_email = gmail.get.user_email();

  gmail.observe.on("compose", function(compose, type) {
    if (type === "reply") {
      email_data = gmail.get.email_data();

      repliedToEmail = findRepliedToThread(compose);
      if (repliedToEmail == undefined) {
        // We can't figure it out for some reason, so just guess it's the
        // last email in the chain.
        repliedToEmail = email_data.last_email;
      }
      last_email = email_data.threads[repliedToEmail];

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

      setTimeout(swapToBcc, 500, from_email, cc_email);
    }
  });
}

refresh(main);
