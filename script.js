// Replace with your Google Apps Script Web App URL
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyi_XZcb9OoQzi8VJTDbAdbVmd7u-m_X-qYWJex1TrHTqANMLcneNLKIeWh1FKsd1TB/exec';
const SECRET_TOKEN = '552'; // Must match the token in Code.gs

// Function to populate Booking Needed dropdown
function populateBookingOptions() {
  if (navigator.onLine) {
    // Online: Fetch options from backend
    fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getOptionsList', token: SECRET_TOKEN }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(options => {
      // Cache options locally
      localStorage.setItem('bookingOptions', JSON.stringify(options));

      // Populate the dropdown
      updateBookingOptions(options);
    })
    .catch(error => {
      console.error('Error fetching options:', error);
      // If error occurs, try to use cached options
      useCachedOptions();
    });
  } else {
    // Offline: Use cached options
    useCachedOptions();
  }
}

// Function to update the Booking Needed dropdown
function updateBookingOptions(options) {
  var select = document.getElementById('bookingNeeded');
  select.innerHTML = ''; // Clear existing options
  options.forEach(function(optionText) {
    var option = document.createElement('option');
    option.value = optionText;
    option.text = optionText;
    select.add(option);
  });
}

// Function to use cached options
function useCachedOptions() {
  var cachedOptions = localStorage.getItem('bookingOptions');
  if (cachedOptions) {
    var options = JSON.parse(cachedOptions);
    updateBookingOptions(options);
  } else {
    // No cached options available
    alert('No booking options available offline. Please connect to the internet to load options.');
  }
}

// Call the function to populate options when the page loads
populateBookingOptions();

// Function to format date with slashes as the user types
function formatDateInput(event) {
  var input = event.target;
  var value = input.value.replace(/\D/g, '');
  var formattedValue = '';

  for (var i = 0; i < value.length && i < 8; i++) {
    formattedValue += value[i];
    if (i === 1 || i === 3) {
      formattedValue += '/';
    }
  }
  input.value = formattedValue;
}

// Pre-populate the date field with today's date in dd/MM/yyyy format
function prefillDate() {
  var dateInput = document.getElementById('date');
  var today = new Date();
  var day = ('0' + today.getDate()).slice(-2);
  var month = ('0' + (today.getMonth() + 1)).slice(-2);
  var year = today.getFullYear();
  dateInput.value = day + '/' + month + '/' + year;
}

// Add event listener to format date input
document.getElementById('date').addEventListener('input', formatDateInput);

// Pre-fill the date when the form loads
window.onload = prefillDate;

// Function to capitalize each word
function capitalizeWords(str) {
  return str.replace(/\b\w+/g, function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

// Add event listener to capitalize each word in Name & Surname
document.getElementById('name').addEventListener('input', function(event) {
  var input = event.target;
  input.value = capitalizeWords(input.value);
});

// Function to format ID Number as 000000 0000 00 0
function formatIDNumber(event) {
  var input = event.target;
  var value = input.value.replace(/\D/g, '');
  var formattedValue = '';

  if (value.length > 0) {
    formattedValue += value.substring(0, 6);
  }
  if (value.length > 6) {
    formattedValue += ' ' + value.substring(6, 10);
  }
  if (value.length > 10) {
    formattedValue += ' ' + value.substring(10, 12);
  }
  if (value.length > 12) {
    formattedValue += ' ' + value.substring(12, 13);
  }

  input.value = formattedValue;
}

// Add event listener to format ID Number
document.getElementById('idNumber').addEventListener('input', formatIDNumber);

// Function to format Contact Number as 000 000 0000
function formatContactNumber(event) {
  var input = event.target;
  var value = input.value.replace(/\D/g, '');
  var formattedValue = '';

  if (value.length > 0) {
    formattedValue += value.substring(0, 3);
  }
  if (value.length > 3) {
    formattedValue += ' ' + value.substring(3, 6);
  }
  if (value.length > 6) {
    formattedValue += ' ' + value.substring(6, 10);
  }

  input.value = formattedValue;
}

// Add event listener to format Contact Number
document.getElementById('contactNumber').addEventListener('input', formatContactNumber);

// Function to save data locally when offline
function saveDataLocally(formData) {
  let submissions = JSON.parse(localStorage.getItem('submissions')) || [];
  submissions.push(formData);
  localStorage.setItem('submissions', JSON.stringify(submissions));
}

// Function to sync local data with backend when online
function syncData() {
  let submissions = JSON.parse(localStorage.getItem('submissions'));
  if (submissions && submissions.length > 0) {
    // Use a copy of submissions to avoid mutation issues
    let submissionsCopy = [...submissions];
    submissionsCopy.forEach((formData, index) => {
      fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'processForm',
          token: SECRET_TOKEN,
          formData: formData
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(result => {
        if (result.status === 'success') {
          // Remove the submission from localStorage
          submissions.shift();
          localStorage.setItem('submissions', JSON.stringify(submissions));
        }
      })
      .catch(error => {
        console.error('Error syncing data:', error);
      });
    });
  }
}

// Listen for online event to sync data and update options
window.addEventListener('online', function() {
  syncData();
  populateBookingOptions(); // Update options when back online
});

// Form submission handler
document.getElementById('myForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Disable the submit button and show the spinner
  var submitButton = document.getElementById('submitButton');
  var spinner = document.getElementById('spinner');
  submitButton.disabled = true;
  spinner.style.display = 'block';

  // Clear previous errors
  document.getElementById('dateError').textContent = '';
  document.getElementById('idError').textContent = '';
  document.getElementById('contactError').textContent = '';

  // Collect form data
  var formData = {
    date: document.getElementById('date').value,
    name: document.getElementById('name').value.trim(),
    idNumber: document.getElementById('idNumber').value.trim(),
    contactNumber: document.getElementById('contactNumber').value.trim(),
    bookingNeeded: document.getElementById('bookingNeeded').value
  };

  // Client-side validation
  var valid = true;

  // Validate date
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.date)) {
    document.getElementById('dateError').textContent = 'Invalid date format.';
    valid = false;
  }

  // Remove non-digit characters for ID Number and Contact Number
  var idNumberDigits = formData.idNumber.replace(/\D/g, '');
  var contactNumberDigits = formData.contactNumber.replace(/\D/g, '');

  // Validate ID Number
  if (idNumberDigits.length !== 13) {
    document.getElementById('idError').textContent = 'ID Number must be 13 digits.';
    valid = false;
  }

  // Validate Contact Number
  if (contactNumberDigits.length !== 10) {
    document.getElementById('contactError').textContent = 'Contact Number must be 10 digits.';
    valid = false;
  }

  if (valid) {
    // Include unformatted numbers
    formData.idNumberDigits = idNumberDigits;
    formData.contactNumberDigits = contactNumberDigits;

    if (navigator.onLine) {
      // Submit data to backend
      fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'processForm',
          token: SECRET_TOKEN,
          formData: formData
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(result => {
        // Hide the spinner and enable the button
        spinner.style.display = 'none';
        submitButton.disabled = false;

        if (result.status === 'success') {
          // Hide the form and show the success message
          document.getElementById('myForm').style.display = 'none';
          document.getElementById('successMessage').style.display = 'block';
        } else {
          alert('Error: ' + result.error);
        }
      })
      .catch(error => {
        // Hide the spinner and enable the button
        spinner.style.display = 'none';
        submitButton.disabled = false;

        alert('Error submitting form: ' + error.message);
      });
    } else {
      // Save data locally
      saveDataLocally(formData);

      // Hide the spinner and enable the button
      spinner.style.display = 'none';
      submitButton.disabled = false;

      alert('You are offline. Your submission will be synced when back online.');

      // Hide the form and show the success message
      document.getElementById('myForm').style.display = 'none';
      document.getElementById('successMessage').style.display = 'block';
    }
  } else {
    // Hide the spinner and enable the button if validation fails
    spinner.style.display = 'none';
    submitButton.disabled = false;
  }
});

// Add event listener for the new submission button
document.getElementById('newSubmissionButton').addEventListener('click', function() {
  // Hide the success message and show the form
  document.getElementById('successMessage').style.display = 'none';
  document.getElementById('myForm').style.display = 'block';

  // Reset the form
  document.getElementById('myForm').reset();
  prefillDate();
  populateBookingOptions(); // Ensure options are loaded
});

// Add event listener for the Clear Data/Clear Cache button
document.getElementById('clearDataButton').addEventListener('click', function() {
  // Confirm the action with the user
  if (confirm('Are you sure you want to clear all locally stored data and cached options?')) {
    // Clear localStorage
    localStorage.removeItem('submissions');
    localStorage.removeItem('bookingOptions');

    // Provide feedback to the user
    alert('All locally stored data and cached options have been cleared.');

    // Reset the form and reload options
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('myForm').style.display = 'block';
    document.getElementById('myForm').reset();
    prefillDate();
    populateBookingOptions();
  }
});
