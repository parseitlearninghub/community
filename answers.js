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
  const answersModal = document.getElementById("answersModal");
  let activeFeed = null;


  document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search); // Get query parameters
    const postId = urlParams.get('postId'); // Retrieve the 'postId' value
  
    if (postId) {
      openAnswersModal(postId); // Open the modal and load content based on postId
    } else {
      console.log("No postId provided in the URL.");
    }
  });

// Function to open the modal and load answers
function openAnswersModal(postId) {
    const overlay = document.getElementById('overlay');
    const answersModal = document.getElementById('answersModal');
  
    if (overlay && answersModal) {
      overlay.classList.add('active');
      answersModal.classList.add('active');
      loadAnswers(postId); // Call a function to fetch and display answers
    }
  }
  
// Close modal event
document.getElementById("close_answermodal").addEventListener("click", function () {
    window.history.back();
});

// The function to post a comment (answer) to the correct post in Firebase
// Function to handle the "Send Answer" button click event
document.getElementById("answer_btn").addEventListener("click", function () {
    const student_id = localStorage.getItem("user-parser"); // Ensure you're getting the correct student ID
    const content = document.getElementById("newComment").value.trim(); // Get the content of the new answer
    
    if (content.trim() === "") {
      alert("Answer cannot be empty.");
      return;
    }
  
    // Get the postId from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    
    // Ensure the postId is available
    if (!postId) {
      console.error("No postId in URL.");
      return;
    }
  
    // Call the postAnswer function to send the answer
    postAnswer(student_id, localStorage.getItem("student_username"), content, postId);
  
    // Clear the input field after posting the answer
    document.getElementById("newComment").value = "";
  });
  
  // The function to post a comment (answer) to the correct post in Firebase
  function postAnswer(student_id, username, content, postId) {
    const answer_id = Date.now().toString();
  
    console.log("Active post ID:", postId);
  
    // Adding the answer to the correct post's answers
    update(ref(database, `PARSEIT/community/posts/${postId}/answers/${answer_id}`), {
      student_id: student_id,
      content: content,
      username: username,
      time: Number(getCurrentTime()),
    })
      .then(() => {
        console.log("Answer posted successfully");
        loadAnswers(postId);  // Reload the answers for the active post
      })
      .catch((error) => {
        console.error("Error posting answer:", error);
        alert("Failed to post answer. Please try again.");
      });
  }
  
  // Define getCurrentTime before postAnswer
  function getCurrentTime() {
    return Date.now(); // Numeric timestamp for storage
  }
  
  
  // Function to load answers for the specific post
  function loadAnswers(postId) {
    console.log("Post ID:", postId);
    console.log("Loading answers for post ID:", postId);
    const answersRef = ref(database, `PARSEIT/community/posts/${postId}/answers/`);
  
    get(answersRef)
      .then((snapshot) => {
        const modalBody = document.querySelector(".answer-modal-body");
        modalBody.innerHTML = ""; // Clear previous answers
  
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
                // <small class="text_reply" id="reply-answer" data-answer-id="${answerId}">Reply</small>
              </div>
            `;
            modalBody.appendChild(answerElement);
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