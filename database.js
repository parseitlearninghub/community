
import {
  getDatabase,
  ref,
  get,
  child,
  update,
  remove,
  set,
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
const overlay = document.getElementById("overlay");
const queryModal = document.getElementById("queryModal");
const answersModal = document.getElementById("answersModal");
let activeFeed = null; 

document.getElementById("community_home_btn").addEventListener("click", function () {
  location.reload();
});

//executed when clicking the "Have a question?" div
document.getElementById("postbtn").addEventListener("click", function() {
  overlay.classList.add("active");
  queryModal.classList.add("active");
  document.getElementById('queryDescription').value = '';
  document.getElementById('post_query_btn').textContent = "Post Query";
});
//to open the answer section
function openAnswersModal(feedElement, postId) {
  localStorage.setItem("active_post_id", postId);
  overlay.classList.add("active");
  answersModal.classList.add("active");
  activeFeed = feedElement; 
  loadAnswers(postId);
}
//to close the answer section
document.getElementById("close_answermodal").addEventListener("click", function() {
  overlay.classList.remove("active");
  answersModal.classList.remove("active");
  activeFeed = null;
});

// to close the "Post Your Query" section
function closeModal() {
  overlay.classList.remove("active");
  queryModal.classList.remove("active");
}
document.getElementById("close_btn").addEventListener("click", closeModal);

// Consolidated toggle logic - to read
function toggleSection(buttonId, sectionId) {
  const icons = document.querySelectorAll('.header_icons div');
  const sections = document.querySelectorAll('.section');

  // Deactivate all icons and sections
  icons.forEach(icon => icon.classList.remove('active'));
  sections.forEach(section => section.classList.remove('active'));

  // Activate the clicked icon and corresponding section
  document.getElementById(buttonId).classList.add('active');
  document.getElementById(sectionId).classList.add('active');
}
// - to read
function setupToggleEvent(buttonId, sectionId) {
  document.getElementById(buttonId).addEventListener('click', () => {
    toggleSection(buttonId, sectionId);
  });
}
// - to read
setupToggleEvent('notification_btn', 'notif_page_section');
setupToggleEvent('messages_page_btn', 'messages_page_section');
setupToggleEvent('community_home_btn', 'community_home_section');
//to get display the username
const username = localStorage.getItem("student_username");
if (username) {
    document.getElementById('username-placeholder').textContent = username;
} else {
  document.getElementById('username-placeholder').textContent = "Parser";
}
// - to read
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
function loadPosts() { 
  const postsRef = ref(database, `PARSEIT/community/posts/`);
  const currentUsername = localStorage.getItem("student_username");

  get(postsRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const posts = snapshot.val();
        feedContainer.innerHTML = ""; // Clear the container before loading new posts

        Object.keys(posts).forEach((postId) => {
          const post = posts[postId];
          const menuId = `menu-${postId}`;
          const editId = `edit-${postId}`;
          const reportId = `report-${postId}`;
          const answerId = `answer-${postId}`;

          // Get the number of answers (comments) for the post
          const answersCount = post.answers ? Object.keys(post.answers).length : 0;
          const answerText = answersCount === 0 ? "Answer" : `${answersCount} Answer${answersCount > 1 ? "s" : ""}`;

          const postElement = document.createElement("div");
          postElement.classList.add("feed");

          postElement.innerHTML = `
            <div class="user">
                <div class="profile-pic">
                    <img src="images/profile-pic.jpg" alt="User Picture">
                </div>
                <div class="text">
                    <strong class="username">${post.username}</strong><br>
                    <small class="time-posted">${formatTime(post.time)}</small>
                </div>
                <div class="menu-icon" id="${menuId}">
                    &#8942; 
                    <div class="menu-options">
                        ${post.username === currentUsername ? 
                            `<div class="menu-item" id="${editId}">Edit</div>` 
                            : 
                            `<div class="menu-item" id="${reportId}">Report</div>`}
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

          feedContainer.prepend(postElement);

          document.getElementById(menuId).addEventListener("click", () => toggleMenu(postElement));

          // Add event listeners for Edit, Report, and Answer actions
          if (post.username === currentUsername) {
            // Only allow the post owner to edit
            document.getElementById(editId).addEventListener("click", () => editPost(postId));
          } else {
            // Otherwise, only show the Report option
            document.getElementById(reportId).addEventListener("click", () => reportPost(postId));
          }
          document.getElementById(answerId).addEventListener("click", () => openAnswersModal(postElement, postId));
        });

        checkLongContent(); // Check if any post content is long after loading the posts
      } else {
        console.log("No posts available.");
      }
    })
    .catch((error) => {
      alert("Error loading posts:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  loadPosts();
});

function handleAnswerPost(postId) {
  const postAnswerBtn = document.getElementById("answer_btn");
  const answerTextarea = document.getElementById("newComment");

  const editAnswerId = postAnswerBtn.dataset.editAnswerId;
  const updatedContent = answerTextarea.value.trim();

  if (!updatedContent) {
    alert("Answer content cannot be empty.");
    return;
  }

  if (editAnswerId) {
    // Update existing answer
    const answerRef = ref(database, `PARSEIT/community/posts/${postId}/answers/${editAnswerId}`);
    update(answerRef, { content: updatedContent }).then(() => {
      answerTextarea.value = ""; // Clear the textarea
      delete postAnswerBtn.dataset.editAnswerId; // Remove the editing state
      loadAnswers(postId); // Reload the answers
    }).catch((error) => {
      console.error("Error updating answer:", error);
    });
  } else {
    // Add new answer
    const newAnswerRef = ref(database, `PARSEIT/community/posts/${postId}/answers/`);
    const newAnswerId = push(newAnswerRef).key; // Generate a new unique ID for the answer
    set(ref(database, `PARSEIT/community/posts/${postId}/answers/${newAnswerId}`), {
      username: localStorage.getItem("student_username"),
      content: updatedContent,
      time: Date.now()
    }).then(() => {
      answerTextarea.value = ""; // Clear the textarea
      loadAnswers(postId); // Reload the answers
    }).catch((error) => {
      console.error("Error posting new answer:", error);
    });
  }
}

// Update the post answer button logic
document.getElementById("answer_btn").addEventListener("click", () => {
  const postId = localStorage.getItem("active_post_id");
  handleAnswerPost(postId);
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


// Event listener for each "View More" link
// document.addEventListener('DOMContentLoaded', function() {
//   checkLongContent(); // Check for long content when the page loads
//   document.querySelectorAll('.view-more').forEach(link => {
//     link.addEventListener('click', (e) => {
//       const feedElement = e.target.closest('.feed');
//       toggleViewMore(feedElement);
//     });
//   });
// });

// The function to post a comment (answer) to the correct post in Firebase
function postComment(student_id, username, content) {
  const answer_id = Date.now().toString();
  const active_post = localStorage.getItem("active_post_id");

  if (!active_post) {
    alert("No active post found.");
    return;
  }

  // Adding the answer to the correct post's answers
  update(ref(database, `PARSEIT/community/posts/${active_post}/answers/${answer_id}`), {
    student_id: student_id,
    content: content,
    username: username,
    time: Number(getCurrentTime()),
  })
  .then(() => {
    console.log("Answer posted successfully");
    loadAnswers(active_post);  // Reload the answers for the active post after posting a comment
  })
  .catch((error) => {
    console.error("Error posting answer:", error);
    alert("Failed to post answer. Please try again.");
  });
}

// Event listener for adding a comment (answer)
document.getElementById("answer_btn").addEventListener("click", function () {
  addAnswer();
});

function addAnswer() {
  const student_id = studentId;
  const content = document.getElementById("newComment").value.trim();

  if (content.trim() === "") {
    alert("Answer cannot be empty.");
    return;
  }
 // Post the answer to Firebase
 postComment(student_id, localStorage.getItem("student_username"), content);

 // Clear the input field after posting the answer
 document.getElementById("newComment").value = "";
}
function loadAnswers(postId) { 
  const currentUsername = localStorage.getItem("student_username");
  const answersRef = ref(database, `PARSEIT/community/posts/${postId}/answers/`);
  
  get(answersRef)
    .then((snapshot) => {
      const modalBody = document.querySelector(".answer-modal-body");
      modalBody.innerHTML = ""; // Clear previous answers
      const answerTextarea = document.getElementById("newComment");

      if (snapshot.exists()) {
        const answers = snapshot.val();
        Object.keys(answers).forEach((answerId) => {
          const answer = answers[answerId];
          const formattedTime = timeAgo(answer.time);

          const answerElement = document.createElement("div");
          answerElement.classList.add("answer");
          answerElement.innerHTML = `
            <div class="answer-header">
              <strong>${answer.username}</strong> <small>${formattedTime}</small>
            </div>
            <div class="answer-content-container">
              <p class="community-answers" data-answer-id="${answerId}" data-username="${answer.username}">
                ${answer.content.trim()}
              </p>
              <small class="text_reply" id="reply-answer" data-answer-id="${answerId}">Reply</small>
            </div>
          `;

          modalBody.appendChild(answerElement);

          const replyButton = answerElement.querySelector(".text_reply");
          replyButton.addEventListener("click", (e) => {
            const replySection = document.getElementById('replySection');
            const answerId = e.target.dataset.answerId;

            // Show the full-screen reply section
            replySection.style.display = 'block';
            replySection.innerHTML = `
              <button class="reply-close-btn" id="close_reply_section">
                <img src="images/close-button.png" alt="Close">
              </button>
              <div class="reply-section-header">
                <h3>Replies to Answer ${answerId}</h3>
              </div>
              <div class="reply-content">
                <textarea class="reply-input" id="replyInput"></textarea>
                <button class="post-reply-btn" id="submitReplyBtn">
                  <img src="images/send-comment.png" alt="Send">
                </button>
              </div>
            `;

            // Focus on the reply input
            document.getElementById('replyInput').focus();

            // Add event listener to the submit button to handle reply submission
            document.getElementById('submitReplyBtn').addEventListener('click', () => {
              const replyContent = document.getElementById('replyInput').value.trim();

              if (replyContent === "") {
                alert("Reply cannot be empty.");
                return;
              }

              // Post the reply to Firebase (implement the postReply function as needed)
              postReply(postId, answerId, replyContent);

              // Clear the input field
              document.getElementById('replyInput').value = "";

              // Optionally hide the reply section after submitting
              replySection.style.display = 'none';
            });

            // Add event listener for closing the reply section
            document.getElementById('close_reply_section').addEventListener('click', () => {
              replySection.style.display = 'none'; // Hide the reply section
            });
          });

          const communityAnswer = answerElement.querySelector(".community-answers");
          communityAnswer.addEventListener("click", (e) => {
            const currentUser = currentUsername;
            const isUserOwnAnswer = e.target.dataset.username === currentUser;

            if (isUserOwnAnswer) {
              // Populate textarea and reset cursor to the end of text
              answerTextarea.value = e.target.textContent.trim();
              answerTextarea.focus();
              postAnswerBtn.dataset.editAnswerId = e.target.dataset.answerId; // Mark as editing
            } else {
              alert("You can only edit your own answers.");
            }
          });
        });
      } else {
        modalBody.innerHTML = "<p>No answers yet. Be the first to answer!</p>";
      }
    })
    .catch((error) => {
      console.error("Error loading answers:", error);
    });
}




async function getUsername(student_id) {
  const postsRef = ref(database, `PARSEIT/username/`);

  return await get(postsRef).then((snapshot) => {
    if (snapshot.exists()) {
      const posts = snapshot.val();

      feedContainer.innerHTML = "";

      Object.keys(posts).forEach((postId) => {
        const post = posts[postId];
        if (post === student_id) {
          return localStorage.setItem("active_username", postId);

        }
      })
    }
  });
}

// Helper function to calculate relative time
function timeAgo(timestamp) {
  // Ensure the timestamp is a valid number
  const timestampNumber = Number(timestamp);
  if (isNaN(timestampNumber)) {
      return "Invalid time";
  }

  const now = Date.now(); // Current time in milliseconds
  const difference = now - timestampNumber; // Difference in milliseconds

  const seconds = Math.floor(difference / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
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
document.addEventListener('click', function(event) {
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
  const overlay = document.getElementById("overlay");
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