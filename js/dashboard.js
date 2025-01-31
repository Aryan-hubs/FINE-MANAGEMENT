// Check if user is logged in
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'login.html';
}

// Initialize arrays and amounts
let fines = JSON.parse(localStorage.getItem('fines')) || [];
let fineUsage = JSON.parse(localStorage.getItem('fineUsage')) || [];
let welfareAmount = parseFloat(localStorage.getItem('welfareAmount')) || 0;
let maintenanceAmount = parseFloat(localStorage.getItem('maintenanceAmount')) || 0;
let emergencyAmount = parseFloat(localStorage.getItem('emergencyAmount')) || 0;

// Calculate total collected amount
function calculateTotalCollected() {
    return fines
        .filter(fine => fine.status === 'paid')
        .reduce((sum, fine) => sum + fine.amount, 0);
}

// Calculate total used amount
function calculateTotalUsed() {
    return fineUsage.reduce((sum, usage) => sum + usage.amount, 0);
}

// Calculate remaining amount
function calculateRemainingAmount() {
    return calculateTotalCollected() - calculateTotalUsed();
}

// Update all amounts displayed
function updateAmounts() {
    const totalCollected = calculateTotalCollected();
    const totalUsed = calculateTotalUsed();
    const remainingAmount = calculateRemainingAmount();
    
    // Update displays
    document.getElementById('totalCollectedAmount').textContent = totalCollected.toFixed(2);
    document.getElementById('totalUsedAmount').textContent = totalUsed.toFixed(2);
    document.getElementById('totalAmount').textContent = remainingAmount.toFixed(2);
    document.getElementById('welfareAmount').textContent = welfareAmount.toFixed(2);
    document.getElementById('maintenanceAmount').textContent = maintenanceAmount.toFixed(2);
    document.getElementById('emergencyAmount').textContent = emergencyAmount.toFixed(2);
}

// Initialize on page load
updateAmounts();
updateDashboard();
updateUsageHistory();

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
    updateAmounts();
});

// Handle collect fine form
document.getElementById('collectFineForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const studentName = document.getElementById('collectStudentName').value;
    const roomNumber = document.getElementById('collectRoomNumber').value;
    
    let found = false;
    let collectedAmount = 0;
    
    fines = fines.map(fine => {
        if (fine.studentName === studentName && 
            fine.roomNumber === roomNumber && 
            fine.status === 'pending') {
            found = true;
            collectedAmount += fine.amount;
            return { ...fine, status: 'paid' };
        }
        return fine;
    });
    
    if (!found) {
        alert('No pending fines found for this student.');
    } else {
        localStorage.setItem('fines', JSON.stringify(fines));
        
        // Update remaining amount when fine is collected
        welfareAmount += collectedAmount / 3;
        maintenanceAmount += collectedAmount / 3;
        emergencyAmount += collectedAmount / 3;
        
        localStorage.setItem('welfareAmount', welfareAmount);
        localStorage.setItem('maintenanceAmount', maintenanceAmount);
        localStorage.setItem('emergencyAmount', emergencyAmount);
        
        updateDashboard();
        updateAmounts();
        updateAllocations();
        
        bootstrap.Modal.getInstance(document.getElementById('collectFineModal')).hide();
        this.reset();
        alert('Fine collected successfully!');
    }
});

// Toggle event listeners
document.getElementById('welfareToggle').addEventListener('change', updateAllocations);
document.getElementById('maintenanceToggle').addEventListener('change', updateAllocations);
document.getElementById('emergencyToggle').addEventListener('change', updateAllocations);

// Update allocations when toggles change
function updateAllocations() {
    const remainingAmount = calculateRemainingAmount();
    const activeToggles = [
        document.getElementById('welfareToggle').checked,
        document.getElementById('maintenanceToggle').checked,
        document.getElementById('emergencyToggle').checked
    ].filter(Boolean).length;

    if (activeToggles === 0) {
        document.getElementById('welfareAmount').textContent = '0';
        document.getElementById('maintenanceAmount').textContent = '0';
        document.getElementById('emergencyAmount').textContent = '0';
        return;
    }

    const amountPerCategory = (remainingAmount / activeToggles).toFixed(2);

    document.getElementById('welfareAmount').textContent = 
        document.getElementById('welfareToggle').checked ? amountPerCategory : '0';
    document.getElementById('maintenanceAmount').textContent = 
        document.getElementById('maintenanceToggle').checked ? amountPerCategory : '0';
    document.getElementById('emergencyAmount').textContent = 
        document.getElementById('emergencyToggle').checked ? amountPerCategory : '0';

    // Update input max values
    document.getElementById('welfareUseAmount').max = document.getElementById('welfareAmount').textContent;
    document.getElementById('maintenanceUseAmount').max = document.getElementById('maintenanceAmount').textContent;
    document.getElementById('emergencyUseAmount').max = document.getElementById('emergencyAmount').textContent;
}

// Handle using fine amount
function useFineAmount(category) {
    const availableAmount = parseFloat(document.getElementById(`${category}Amount`).textContent);
    const requestedAmount = parseFloat(document.getElementById(`${category}UseAmount`).value);

    if (!requestedAmount || requestedAmount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (requestedAmount > availableAmount) {
        alert(`Cannot use ₹${requestedAmount}. Available amount is ₹${availableAmount}`);
        return;
    }

    const purpose = prompt(`Enter purpose for using ₹${requestedAmount} from ${category} fund:`);
    if (!purpose) return;

    const usage = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount: requestedAmount,
        purpose: purpose
    };

    // Update remaining amount
    if (category === 'welfare') {
        welfareAmount -= requestedAmount;
        localStorage.setItem('welfareAmount', welfareAmount);
    } else if (category === 'maintenance') {
        maintenanceAmount -= requestedAmount;
        localStorage.setItem('maintenanceAmount', maintenanceAmount);
    } else if (category === 'emergency') {
        emergencyAmount -= requestedAmount;
        localStorage.setItem('emergencyAmount', emergencyAmount);
    }

    // Add to usage history
    fineUsage.push(usage);
    localStorage.setItem('fineUsage', JSON.stringify(fineUsage));
    
    // Reset input and toggle
    document.getElementById(`${category}UseAmount`).value = '';
    document.getElementById(`${category}Toggle`).checked = false;
    
    updateAllocations();
    updateUsageHistory();
    updateAmounts();
}

// Update usage history table
function updateUsageHistory() {
    const usageHistory = document.getElementById('usageHistory');
    usageHistory.innerHTML = fineUsage.map(usage => `
        <tr>
            <td>${usage.date}</td>
            <td>${usage.category}</td>
            <td>₹${usage.amount.toFixed(2)}</td>
            <td>${usage.purpose}</td>
        </tr>
    `).join('');
}

// Update dashboard with current fines
function updateDashboard() {
    const fineRecords = document.getElementById('fineRecords');
    
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
    let amountChanged = 0;
    
    fines = fines.map(fine => {
        if (fine.id === id) {
            if (fine.status === 'pending' && newStatus === 'paid') {
                amountChanged = fine.amount;
            }
            return { ...fine, status: newStatus };
        }
        return fine;
    });
    
    localStorage.setItem('fines', JSON.stringify(fines));
    
    // Update remaining amount when marking as paid
    if (amountChanged > 0) {
        welfareAmount += amountChanged / 3;
        maintenanceAmount += amountChanged / 3;
        emergencyAmount += amountChanged / 3;
        
        localStorage.setItem('welfareAmount', welfareAmount);
        localStorage.setItem('maintenanceAmount', maintenanceAmount);
        localStorage.setItem('emergencyAmount', emergencyAmount);
    }
    
    updateDashboard();
    updateAmounts();
    updateAllocations();
}

// Delete fine
function deleteFine(id) {
    if (confirm('Are you sure you want to delete this fine record?')) {
        fines = fines.filter(fine => fine.id !== id);
        localStorage.setItem('fines', JSON.stringify(fines));
        updateDashboard();
        updateAmounts();
        updateAllocations();
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
