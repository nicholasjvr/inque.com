import { db } from '../script.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const usersContainer = document.getElementById('users-container');

    if (!usersContainer) return;

    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        usersSnapshot.forEach(doc => {
            const userData = doc.data();

            // Create user card element
            const card = document.createElement('div');
            card.className = 'user-card';

            card.innerHTML = `
                <div class="user-card-pic" style="background-image: url(${userData.photoURL})"></div>
                <h3 class="user-card-name">${userData.name}</h3>
            `;

            usersContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        usersContainer.innerHTML = '<p>Could not load users.</p>';
    }
});