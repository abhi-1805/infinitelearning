// script.js
document.addEventListener('DOMContentLoaded', function() {
    const signUpButton = document.getElementById('signUpButton');
    const signInButton = document.getElementById('signInButton');
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

    // Handle Sign Up
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            fullName: document.getElementById('fName').value,
            branch: document.getElementById('branch').value,
            year: document.getElementById('year').value,
            rollNo: document.getElementById('rollno').value,
            email: document.getElementById('signupEmail').value,
            password: document.getElementById('signupPassword').value
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