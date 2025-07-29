document.addEventListener("DOMContentLoaded", () => {

    const state = {
        originalData: {},
        newPhotoFile: null,
        objectURLs: [] // to track created object URLs for cleanup
    };

    // initialize the form
    async function init() {
        try {
            const userId = await getAuthenticatedUserId();
            if (!userId) {
                alert("You must be logged in to access this page.");
                window.location.href = "/login.html";
                return;
            }
            await loadUserData(userId);
            setupEventListeners();
        } catch (error) {
            console.error("Initialization failed:", error);
            alert("Failed to initialize profile. Please refresh the page.");
        }
    }

    // get authenticated user ID
    async function getAuthenticatedUserId() {
        try {
            const res = await fetch('/me', {
                credentials: "include"
            });
            if (!res.ok) {
                throw new Error("Failed to fetch user data. Please log in again.");
            }
            const data = await res.json();
            return data.id;
        } catch (error) {
            console.error("Error fetching authenticated user ID:", error);
            throw error;
        }
    }

    // load user data
    async function loadUserData(userId) {
        try {
            const user = await fetchUserDetails(userId);

            // populate form fields
            document.getElementById("Email").value = user.Email || "";
            document.getElementById("Name").value = user.Name || "";
            document.getElementById("PhoneNumber").value = user.PhoneNumber || "";
            document.getElementById("username").textContent = user.Name || "User";
            if (user.ProfilePicture) {
                document.getElementById("profile-picture").src = user.ProfilePicture;
            }

            // store original data for cancel functionality
            state.originalData = { ...user };
            
            // disable form initially
            toggleFormEditability(false);

        } catch (error) {
            console.error("Error loading user data:", error);
            throw error;
        }
    }

    // fetch user details by ID
    async function fetchUserDetails(userId) {
        try {
            const res = await fetch (`/users/${userId}`, {
                credentials: "include"
            });
            if (!res.ok) {
                throw new Error("Failed to fetch user data. Please try again.");
            }
            const user = await res.json();
            console.log('Fetched user data:', user);
            if (!user || !user.ID) {
                throw new Error("User not found. Please log in again.");
            }
            return user;
        } catch (error) {
            console.error("Error fetching current user:", error);
            throw error;
        }
    }

    // setup all event listeners
    function setupEventListeners() {
        document.querySelector(".edit-button").addEventListener("click", handleEdit);
        document.querySelector(".save-button").addEventListener("click", handleSave);
        document.querySelector(".cancel-button").addEventListener("click", handleCancel);
        document.querySelector(".delete-account-button").addEventListener("click", handleDelete);
        document.querySelector(".reset-password-link").addEventListener("click", handlePasswordToggle);
        document.getElementById("photo-input").addEventListener("change", handlePhotoChange);
    }

    // toggle form editability
    function toggleFormEditability(editable) {
        const inputs = document.getElementById("profile-form").querySelectorAll("input, select");
        inputs.forEach(input => input.disabled = !editable);
        
        document.querySelector(".save-button").disabled = !editable;
        document.querySelector(".cancel-button").disabled = !editable;
    }

    // handle edit button 
    function handleEdit() {
        toggleFormEditability(true);
    }

    // handle password section toggle
    function handlePasswordToggle(e) {
        e.preventDefault();
        const passwordSection = document.querySelector(".password-change-section");
        const isActive = passwordSection.classList.toggle("active");
        
        const currentPasswordInput = document.getElementById("current-password");
        const newPasswordInput = document.getElementById("new-password");
        
        currentPasswordInput.disabled = !isActive;
        newPasswordInput.disabled = !isActive;
        
        // clear fields when hiding
        if (!isActive) {
            currentPasswordInput.value = "";
            newPasswordInput.value = "";
        }
        
        // enable and cancel buttons when making changes
        document.querySelector(".save-button").disabled = false;
        document.querySelector(".cancel-button").disabled = false;
    }

    // handle photo change
    function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        // clean up previous object URLs
        cleanupObjectURLs();

        state.newPhotoFile = file;
        const previewURL = URL.createObjectURL(file);
        state.objectURLs.push(previewURL); // track the new URL
        document.getElementById("profile-picture").src = previewURL;

        // enable save and cancel buttons
        document.querySelector(".save-button").disabled = false;
        document.querySelector(".cancel-button").disabled = false;
    }

    // prepare user data from form
    function prepareUserData() {
        const updatedUser = {
            Email: document.getElementById("Email").value.trim(),
            Name: document.getElementById("Name").value.trim(),
            PhoneNumber: document.getElementById("PhoneNumber").value.trim(),
            ProfilePicture: state.newPhotoFile ? undefined : state.originalData.ProfilePicture
        };

        const currentPassword = document.getElementById("current-password").value.trim();
        const newPassword = document.getElementById("new-password").value.trim();
        
        if (currentPassword && newPassword) {
            updatedUser.Password = currentPassword;
            updatedUser.NewPassword = newPassword;
        } else if (currentPassword || newPassword) {
            throw new Error("Both passwords required");
        }
        
        return updatedUser;
    }

    // handle save button click
    async function handleSave() {
        try {
            const userId = await getAuthenticatedUserId();
            if (!userId) { throw new Error("User not authenticated. Please log in again."); }
            const updatedUser = prepareUserData();
            
            // handle profile picture upload if changed
            if (state.newPhotoFile) {
                try {
                    const uploadResult = await uploadProfilePicture(state.newPhotoFile);
                    updatedUser.ProfilePicture = uploadResult.url;
                } catch (error) {
                    throw new Error("Failed to upload profile picture: " + error.message);
                }
            }

            // update user profile
            await updateUserProfile(userId, updatedUser);

            document.getElementById("username").textContent = updatedUser.Name;
            state.originalData = { ...state.originalData, ...updatedUser, ProfilePicture: updatedUser.ProfilePicture };
            state.newPhotoFile = null;

            alert("Profile updated successfully.");
            toggleFormEditability(false);

            // reset password section if active
            const passwordSection = document.querySelector(".password-change-section");
            if (passwordSection.classList.contains("active")) {
                passwordSection.classList.remove("active");
                document.getElementById("current-password").value = "";
                document.getElementById("new-password").value = "";
                document.getElementById("current-password").disabled = true;
                document.getElementById("new-password").disabled = true;
            }
        } catch (error) {
            console.error("Save error:", error);
            alert(error.message || "Failed to save profile. Please try again.");
        } 
    } 

    // handle cancel button click
    function handleCancel() {
        // revert form fields
        document.getElementById("Email").value = state.originalData.Email || "";
        document.getElementById("Name").value = state.originalData.Name || "";
        document.getElementById("PhoneNumber").value = state.originalData.PhoneNumber || "";
        
        // revert profile picture
        const profilePicture = document.getElementById("profile-picture");
        if (state.originalData.ProfilePicture) {
            profilePicture.src = state.originalData.ProfilePicture;
        } else {
            profilePicture.src = "/assets/icons/blank-profile-picture.svg";
        }
        
        // clear file input and temp file reference
        document.getElementById("photo-input").value = "";
        state.newPhotoFile = null;
        cleanupObjectURLs();
        
        // reset password section
        const passwordSection = document.querySelector(".password-change-section");
        if (passwordSection.classList.contains("active")) {
            passwordSection.classList.remove("active");
            document.getElementById("current-password").value = "";
            document.getElementById("new-password").value = "";
            document.getElementById("current-password").disabled = true;
            document.getElementById("new-password").disabled = true;
        }
        
        // Disable form
        toggleFormEditability(false);
    }

    // handle delete account
    async function handleDelete() {
        const confirmDelete = confirm("Are you sure you want to delete your account? This action cannot be undone.");
        if (!confirmDelete) return;

        try { 
            const userId = await getAuthenticatedUserId();
            if (!userId) { throw new Error("User not authenticated. Please log in again."); }
            await deleteUserAccount(userId);
            alert("Account deleted successfully.");
            window.location.href = "/signup.html";
            
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete account. Please try again.");
        }
    }

    // clean up object URLs to prevent memory leaks
    function cleanupObjectURLs() {
        state.objectURLs.forEach(url => URL.revokeObjectURL(url));
        state.objectURLs = [];
    }

    // upload profile picture to server
    async function uploadProfilePicture(file) {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload/profile_pictures", {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to upload profile picture. Please try again.");
            }

            return await res.json();
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            throw error;
        }
    }

    async function updateUserProfile(userId, userData) {
        try {
            const response = await fetch(`/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData),
                credentials: "include"
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 404) {
                    throw new Error(error.message || "User not found or password incorrect.");
                } else if (response.status === 400) {
                    throw new Error("Invalid data. Please check your input.");
                } else {
                    throw new Error(error.message || "Failed to update profile. Please try again.");
                }
            }
            return await response.json();
    } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    }

    async function deleteUserAccount(userId) {
        try {
            const response = await fetch(`/users/${userId}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to delete account. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting user account:", error);
            throw error;
        }
    }

    init();
});