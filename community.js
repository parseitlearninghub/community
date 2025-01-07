import {
  getDatabase,
  ref,
  get,
  child,
  update,
  remove,
  set,
  push
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFqgbA_t3EBVO21nW70umJOHX3UdRr9MY",
  authDomain: "parseit-8021e.firebaseapp.com",
  databaseURL: "https://parseit-8021e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "parseit-8021e",
  storageBucket: "parseit-8021e.firebasestorage.app",
  messagingSenderId: "15166597986",
  appId: "1:15166597986:web:04b0219b1733780ae61a3b"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dbRef = ref(database);

const studentId = localStorage.getItem("user-parser");
const overlay = document.getElementById("query-overlay");
const queryModal = document.getElementById("queryModal");
//let activeFeed = null;
const profileStudentRef = ref(database, `PARSEIT/administration/students/${studentId}/`);
get(profileStudentRef).then((profileStudentSnapshot) => {
  if (profileStudentSnapshot.exists()) {
    document.getElementById('active-profile-pic').src = `images/profiles/${profileStudentSnapshot.val().profile}`;
  }
  else {
    const profileTeacherRef = ref(database, `PARSEIT/administration/teachers/${studentId}/`);
    get(profileTeacherRef).then((profileteachersSnapshot) => {
      if (profileteachersSnapshot.exists()) {
        if (profileteachersSnapshot.val().profile !== undefined) {
          document.getElementById('active-profile-pic').src = `images/profiles/${profileStudentSnapshot.val().profile}`;
        }
        else {
          document.getElementById('active-profile-pic').src = `images/profiles/default_profile.png`;
        }

      }
      else {
        document.getElementById('active-profile-pic').src = `images/profiles/default_profile.png`;
      }
    });
  }
});

document.getElementById("community_home_btn").addEventListener("click", function () {
  location.reload();
});

//executed when clicking the "Have a question?" div
document.getElementById("postbtn").addEventListener("click", function () {
  overlay.classList.add("active");
  queryModal.classList.add("active");
  document.getElementById('queryDescription').value = '';
  document.getElementById('post_query_btn').textContent = "Post Query";
});

// to close the "Post Your Query" section
function closeModal() {
  overlay.classList.remove("active");
  queryModal.classList.remove("active");
}
document.getElementById("close_btn").addEventListener("click", closeModal);

// functions for toggling header icons
function toggleSection(buttonId, sectionId) {
  const icons = document.querySelectorAll('.header_icons div');
  const sections = document.querySelectorAll('.section');

  icons.forEach(icon => icon.classList.remove('active'));
  sections.forEach(section => section.classList.remove('active'));

  document.getElementById(buttonId).classList.add('active');
  document.getElementById(sectionId).classList.add('active');
}
function setupToggleEvent(buttonId, sectionId) {
  document.getElementById(buttonId).addEventListener('click', () => {
    toggleSection(buttonId, sectionId);
    displayNotification();
  });
}
setupToggleEvent('notification_btn', 'notif_page_section');
setupToggleEvent('community_home_btn', 'community_home_section');

async function displayNotification () {
  const postsRef = ref(database, `PARSEIT/community/notifications/`);

  await get(postsRef).then((snapshot) => {
    if (snapshot.exists()) {
      const notification = snapshot.val();
      Object.keys(notification).forEach((notificationsId) => {
        console.log(notificationsId);
      })
    }
  })
}
//to get display the username
const username = localStorage.getItem("student_username");
if (username) {
  document.getElementById('username-placeholder').textContent = username;
} else {
  document.getElementById('username-placeholder').textContent = "Parser";
}
// to get username
async function getParser(student_id) {
  const postsRef = ref(database, `PARSEIT/username/`);

  return await get(postsRef).then((snapshot) => {
    if (snapshot.exists()) {
      const posts = snapshot.val();
      Object.keys(posts).forEach((postId) => {
        const post = posts[postId];
        if (post === student_id) {
          localStorage.setItem("student_username", postId);
          const username = localStorage.getItem("student_username");
          if (username) {
            document.getElementById('username-placeholder').textContent = username;
          }
        }
      });
    }
  });
}
getParser(studentId);

const feedContainer = document.getElementById("feedContainer");

document.getElementById("post_query_btn").addEventListener("click", function () {
  const student_id = studentId;
  const time = getCurrentTime();
  const post_id = Date.now().toString();
  const description = document.getElementById("queryDescription").value;
  if (description.trim() === "") {
    alert("Query description cannot be empty.");
    return;
  }

  submitQuery(localStorage.getItem("student_username"), time, description, post_id, student_id);

  // Clear the input field and close the modal after posting
  document.getElementById("queryDescription").value = "";
  closeModal();
  loadPosts();
})
const time = Date.now(); // Current time as a numeric timestamp
function submitQuery(username, time, description, post_id, student_id) {

  // Add the post to Firebase
  update(ref(database, `PARSEIT/community/posts/${post_id}`), {
    student_id: student_id,
    username: username,
    time: time,
    description: description
  }).catch((error) => {
    console.error("Error posting query:", error);
    alert("Failed to post query. Please try again.");
  });
}

// Function to load posts
async function loadPosts() {
  const postsRef = ref(database, `PARSEIT/community/posts/`);
  const currentUsername = localStorage.getItem("student_username");

  try {
    const snapshot = await get(postsRef);
    if (snapshot.exists()) {
      const posts = snapshot.val();
      feedContainer.innerHTML = ""; // Clear the container before loading new posts

      // Convert posts object to an array, reverse it, and iterate
      const postArray = Object.entries(posts).reverse();
      for (const [postId, post] of postArray) {
        const menuId = `menu-${postId}`;
        const editId = `edit-${postId}`;
        const reportId = `report-${postId}`;
        const answerId = `answer-${postId}`;

        let currentProfile = 'default_profile.png';

        // Fetch the profile asynchronously
        const profileStudentRef = ref(database, `PARSEIT/administration/students/${post.student_id}/`);
        const profileStudentSnapshot = await get(profileStudentRef);
        
        if (profileStudentSnapshot.exists()) {
          currentProfile = profileStudentSnapshot.val().profile;
        } else {
          const profileTeacherRef = ref(database, `PARSEIT/administration/teachers/${post.student_id}/`);
          const profileTeacherSnapshot = await get(profileTeacherRef);
          
          if (profileTeacherSnapshot.exists()) {
            currentProfile = profileTeacherSnapshot.val().profile || 'default_profile.png';
          }
        }

        // Get the number of answers (comments) for the post
        const answersCount = post.answers ? Object.keys(post.answers).length : 0;
        const answerText = answersCount === 0 ? "Answer" : `${answersCount} Answer${answersCount > 1 ? "s" : ""}`;

        const postElement = document.createElement("div");
        postElement.classList.add("feed");
        postElement.dataset.postId = postId;  // Add the postId as a data attribute

        postElement.innerHTML = `
          <div class="user">
            <div class="profile-pic">
              <img src="images/profiles/${currentProfile}" alt="User Picture">
            </div>
            <div class="text">
              <strong class="username">${post.username}</strong><br>
              <small class="time-posted">${formatTime(post.time)}</small>
            </div>
            <div class="menu-icon" id="${menuId}">
              &#8942; 
              <div class="menu-options">
                ${post.username === currentUsername ? 
                  `<div class="menu-item" id="${editId}">
                  <img class="" src="images/edit.png" alt="">Edit</div>` : 
                  `<div class="menu-item" id="${reportId}"><img class="" src="images/report.png" alt="">Report</div>`}
              </div>
            </div>
          </div>
          <div class="post">
            <p>${post.description}</p>
            <span class="view-more">View More</span>
          </div>
          <div class="feed-footer">
            <small class="view-comments" id="${answerId}">${answerText}</small>
          </div>
          <div class="comments"></div> <!-- Comments container -->
        `;

        feedContainer.appendChild(postElement); // Add post to feed container

        document.getElementById(menuId).addEventListener("click", () => toggleMenu(postElement));

        // Add event listeners for Edit, Report, and Answer actions
        if (post.username === currentUsername) {
          document.getElementById(editId).addEventListener("click", () => editPost(postId));
        } else {
          document.getElementById(reportId).addEventListener("click", () => reportPost(postId));
        }

        // Add event listener to open the modal on "Answer"
        document.getElementById(answerId).addEventListener("click", () => {
          window.location.href = `answers.html?postId=${postId}`;
        });
      }

      checkLongContent(); // Check if any post content is long after loading the posts
    } else {
      console.log("No posts available.");
    }
  } catch (error) {
    alert("Error loading posts:", error);
  }
}



document.addEventListener("DOMContentLoaded", function () {
  loadPosts();
});

function toggleViewMore(feedElement) {
  const viewMoreLink = feedElement.querySelector('.view-more');
  feedElement.classList.toggle('expanded');

  if (feedElement.classList.contains('expanded')) {
    viewMoreLink.innerText = 'View Less';
  } else {
    viewMoreLink.innerText = 'View More';
  }
}

// Function to check and show "View More" if content is too long
function checkLongContent() {
  const feedItems = document.querySelectorAll('.feed');
  feedItems.forEach(feed => {
    const postDescription = feed.querySelector('.post p');
    const viewMoreLink = feed.querySelector('.view-more');

    if (postDescription.scrollHeight > postDescription.offsetHeight) {
      viewMoreLink.classList.add('show'); // Show "View More" if content is too long
      viewMoreLink.addEventListener('click', () => toggleViewMore(feed));
    } else {
      viewMoreLink.classList.remove('show'); // Hide "View More" if content fits
    }
  });
}

function getCurrentTime() {
  return Date.now(); // Numeric timestamp for storage
}
function formatTime(timestamp) {
  // Ensure the timestamp is a valid number
  const timestampNumber = Number(timestamp);
  if (isNaN(timestampNumber)) {
    console.error("Invalid timestamp:", timestamp);
    return "Invalid time";
  }

  const now = new Date(timestampNumber);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila", // Specifies Philippine Time
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
}

//FUNCTIONS FOR EDIT AND REPORT 
function toggleMenu(postElement) {
  // Find the menu associated with the current post
  const menu = postElement.querySelector('.menu-options');
  if (menu.classList.contains('show')) {
    menu.classList.remove('show');
    menu.style.display = 'none';
  } else {
    menu.classList.add('show');
    menu.style.display = 'flex'; // Show the menu for the clicked post

  }

  // Close all other menus
  const allMenus = document.querySelectorAll('.menu-options');
  allMenus.forEach((m) => {
    if (m !== menu) {
      m.classList.remove('show');
      m.style.display = 'none';
    }
  });
}

// Close the menu when clicking outside of any menu icon
document.addEventListener('click', function (event) {
  const allMenuIcons = document.querySelectorAll('.menu-icon');
  const allMenuOptions = document.querySelectorAll('.menu-options');

  let clickedInsideMenu = false;

  // Check if the click is inside any menu icon/ menu options
  allMenuIcons.forEach(menuIcon => {
    if (menuIcon.contains(event.target)) {
      clickedInsideMenu = true;
    }
  });

  allMenuOptions.forEach(menuOption => {
    if (menuOption.contains(event.target)) {
      clickedInsideMenu = true;
    }
  });

  // If the click is outside, close all menus
  if (!clickedInsideMenu) {
    allMenuOptions.forEach(menuOption => {
      menuOption.classList.remove('show');
      menuOption.style.display = 'none';
    });
  }
});

// Edit Post Functionality
function editPost(postId) {
  // Reference the modal and its elements
  const modal = document.getElementById("queryModal");
  const overlay = document.getElementById("query-overlay");
  const descriptionField = document.getElementById("queryDescription");
  const postButton = document.getElementById("post_query_btn");

  // Fetch the current post details
  get(ref(database, `PARSEIT/community/posts/${postId}`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const post = snapshot.val();

        // Populate the modal with the current description
        descriptionField.value = post.description;

        // Change the button text to "Done Edit" and remove its existing event listener
        postButton.textContent = "Done Edit";
        postButton.replaceWith(postButton.cloneNode(true)); // Remove existing listeners
        const newPostButton = document.getElementById("post_query_btn");

        // Add a new event listener for updating the post
        newPostButton.addEventListener("click", function handleEdit() {
          const updatedDescription = descriptionField.value.trim();
          if (updatedDescription === "") {
            // Add the red border and shake class
            descriptionField.classList.add("error");

            // Remove the shake animation after it's done to allow retriggering
            setTimeout(() => {
              descriptionField.classList.remove("shake");
            }, 500);

            descriptionField.classList.add("shake");
            return;
          }

          // Update the post in Firebase
          update(ref(database, `PARSEIT/community/posts/${postId}`), {
            description: updatedDescription,
          })
            .then(() => {
              modal.classList.remove("active");
              overlay.classList.remove("active");
              loadPosts(); // Reload posts
            })
            .catch((error) => {
              console.error("Error updating post:", error);
              alert("Failed to update the post.");
            });

          // Restore the original button state after editing
          // newPostButton.textContent = "Post Query";
          newPostButton.replaceWith(newPostButton.cloneNode(true)); // Remove edit listener
        });

        // Open the modal
        overlay.classList.add("active");
        modal.classList.add("active");

        // Focus on the textarea
        descriptionField.focus();
      } else {
        alert("Post not found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching post:", error);
    });
}

// Report Post Functionality
function reportPost(postId) {
  if (confirm("Are you sure you want to report this post?")) {
    update(ref(database, `PARSEIT/community/posts/${postId}`), {
      reported: true, // Add a 'reported' flag
    })
      .then(() => {
        alert("Post reported successfully.");
      })
      .catch((error) => {
        console.error("Error reporting post:", error);
        alert("Failed to report the post.");
      });
  }
}