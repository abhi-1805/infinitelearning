// script.js
document.addEventListener('DOMContentLoaded', function() {
    const signUpButton = document.getElementById('signUpButton');
    const signInButton = document.getElementById('signInButton');
    const alreadyAccountLink = document.getElementById('alreadyAccount');
    const signInForm = document.getElementById('SignIn');
    const signUpForm = document.getElementById('signup');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Toggle between forms
    signUpButton.addEventListener('click', function(e) {
        e.preventDefault();
        signInForm.style.display = "none";
        signUpForm.style.display = "block";
    });

    signInButton.addEventListener('click', function(e) {
        e.preventDefault();
        signUpForm.style.display = "none";
        signInForm.style.display = "block";
    });

    // anchor "Already have an Account?" should also open Sign In
    if (alreadyAccountLink) {
        alreadyAccountLink.addEventListener('click', function(e) {
            e.preventDefault();
            signUpForm.style.display = "none";
            signInForm.style.display = "block";
        });
    }

    // Handle Sign Up
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // password confirmation check
        const newPassword = document.getElementById('signupEmail').value;
        const confirmPassword = document.getElementById('signupPassword').value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match. Please type the same password in both fields.');
            return;
        }
        
        const formData = {
            firstName: document.getElementById('fName').value,      // formerly fullName
            lastName: document.getElementById('branch').value,     // formerly branch
            age: document.getElementById('year').value,            // formerly year (now age)
            email: document.getElementById('rollno').value,        // roll number field is now the email
            password: newPassword                                  // taken from the field that used to be signupEmail
        };

        try {
            console.log('Sending signup request:', formData);
            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('Signup response:', data);

            if (response.ok) {
                alert('Signup successful! Please login.');
                signUpForm.style.display = "none";
                signInForm.style.display = "block";
                signupForm.reset();
            } else {
                alert(data.message || 'Error signing up');
            }
        } catch (error) {
            console.error('Error during signup:', error);
            alert('Error connecting to server. Please try again.');
        }
    });

    // Handle Login
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
    
        const formData = {
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value
        };
    
        try {
            console.log('Sending login request');
            const response = await fetch('http://localhost:5000/api/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
    
            const data = await response.json();
            console.log('Login response:', data);
    
            if (response.ok) {
                alert('Login successful!');
                localStorage.setItem('user', JSON.stringify(data.user)); // Store user data
                window.location.href = 'home.html'; // Redirect to home page
            } else {
                alert(data.message || 'Error signing in');
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('Error connecting to server. Please try again.');
        }
    });
    
});
