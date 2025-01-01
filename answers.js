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
  const overlay = document.getElementById("overlay");
  const answersModal = document.getElementById("answersModal");
  let activeFeed = null;


// Get the postId from the URL
const urlParams = new URLSearchParams(window.location.search);
const postIdFromUrl = urlParams.get('postId');

// If there's no postId in the URL, handle it as needed
if (!postIdFromUrl) {
  alert("No post ID found in the URL.");
  // You could redirect or handle this case accordingly
}

function openAnswersModal(feedElement) {
  localStorage.setItem("active_post_id", postIdFromUrl);
  overlay.classList.add("active");
  answersModal.classList.add("active");
  activeFeed = feedElement;
  loadAnswers(postIdFromUrl); // Load answers using the postId from URL
}

// Close modal event
document.getElementById("close_answermodal").addEventListener("click", function () {
  overlay.classList.remove("active");
  answersModal.classList.remove("active");
  activeFeed = null;
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



// time ago function for answers
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