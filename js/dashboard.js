// Check if user is logged in
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'login.html';
}

// Initialize fines array from localStorage or empty array
let fines = JSON.parse(localStorage.getItem('fines')) || [];
updateDashboard();

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
});

// Handle form submission for new fine
document.getElementById('fineForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fine = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        studentName: document.getElementById('studentName').value,
        roomNumber: document.getElementById('roomNumber').value,
        amount: parseFloat(document.getElementById('amount').value),
        reason: document.getElementById('reason').value,
        status: 'pending'
    };

    fines.push(fine);
    localStorage.setItem('fines', JSON.stringify(fines));
    
    this.reset();
    updateDashboard();
});

// Handle collect fine form
document.getElementById('collectFineForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const studentName = document.getElementById('collectStudentName').value;
    const roomNumber = document.getElementById('collectRoomNumber').value;
    
    // Update all pending fines for this student to paid
    let found = false;
    fines = fines.map(fine => {
        if (fine.studentName === studentName && 
            fine.roomNumber === roomNumber && 
            fine.status === 'pending') {
            found = true;
            return { ...fine, status: 'paid' };
        }
        return fine;
    });
    
    if (!found) {
        alert('No pending fines found for this student.');
    } else {
        localStorage.setItem('fines', JSON.stringify(fines));
        updateDashboard();
        bootstrap.Modal.getInstance(document.getElementById('collectFineModal')).hide();
        this.reset();
        alert('Fine collected successfully!');
    }
});

// Handle withdraw fine form
document.getElementById('withdrawFineForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const studentName = document.getElementById('withdrawStudentName').value;
    const roomNumber = document.getElementById('withdrawRoomNumber').value;
    const reason = document.getElementById('withdrawReason').value;
    
    // Update all pending fines for this student to withdrawn
    let found = false;
    fines = fines.map(fine => {
        if (fine.studentName === studentName && 
            fine.roomNumber === roomNumber && 
            fine.status === 'pending') {
            found = true;
            return { ...fine, status: 'withdrawn', withdrawReason: reason };
        }
        return fine;
    });
    
    if (!found) {
        alert('No pending fines found for this student.');
    } else {
        localStorage.setItem('fines', JSON.stringify(fines));
        updateDashboard();
        bootstrap.Modal.getInstance(document.getElementById('withdrawFineModal')).hide();
        this.reset();
        alert('Fine withdrawn successfully!');
    }
});

// Update dashboard with current fines
function updateDashboard() {
    const fineRecords = document.getElementById('fineRecords');
    const totalAmountElement = document.getElementById('totalAmount');
    
    // Calculate total amount from paid fines
    const totalAmount = fines
        .filter(fine => fine.status === 'paid')
        .reduce((sum, fine) => sum + fine.amount, 0);
    
    totalAmountElement.textContent = totalAmount.toFixed(2);
    
    // Update fine records table
    fineRecords.innerHTML = fines.map(fine => `
        <tr>
            <td>${fine.date}</td>
            <td>${fine.studentName}</td>
            <td>${fine.roomNumber}</td>
            <td>₹${fine.amount.toFixed(2)}</td>
            <td>${fine.reason}</td>
            <td>
                <span class="badge bg-${fine.status === 'paid' ? 'success' : fine.status === 'pending' ? 'warning' : 'danger'}">
                    ${fine.status}
                </span>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteFine(${fine.id})">Delete</button>
                ${fine.status === 'pending' ? `
                    <button class="btn btn-success btn-sm ms-1" onclick="updateFineStatus(${fine.id}, 'paid')">
                        Mark as Paid
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Update fine status
function updateFineStatus(id, newStatus) {
    fines = fines.map(fine => {
        if (fine.id === id) {
            return { ...fine, status: newStatus };
        }
        return fine;
    });
    
    localStorage.setItem('fines', JSON.stringify(fines));
    updateDashboard();
}

// Delete fine
function deleteFine(id) {
    if (confirm('Are you sure you want to delete this fine record?')) {
        fines = fines.filter(fine => fine.id !== id);
        localStorage.setItem('fines', JSON.stringify(fines));
        updateDashboard();
    }
}

// Auto-fill amount based on selected reason
document.getElementById('reason').addEventListener('change', function() {
    const amountInput = document.getElementById('amount');
    const selectedReason = this.value;
    
    const fineAmounts = {
        'Late entry after 10 PM': 100,
        'Room cleanliness violation': 50,
        'Unauthorized guests': 200,
        'Missing roll call': 50,
        'Using electrical appliances': 200,
        'Missing mess without notice': 100,
        'Noise complaints': 150,
        'Smoking/Alcohol possession': 1000,
        'Late fee payment': 50
    };
    
    if (fineAmounts[selectedReason]) {
        amountInput.value = fineAmounts[selectedReason];
    } else {
        amountInput.value = '';
    }
});
