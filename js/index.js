// Get fines and fine usage from localStorage
const fines = JSON.parse(localStorage.getItem('fines')) || [];
const fineUsage = JSON.parse(localStorage.getItem('fineUsage')) || [];

// Calculate and display total fines collected, used amount, and remaining amount
function updateFinancialSummary() {
    // Calculate total fines collected
    const totalCollected = fines
        .filter(fine => fine.status === 'paid')
        .reduce((sum, fine) => sum + fine.amount, 0);
    
    // Calculate total amount used
    const totalUsed = fineUsage.reduce((sum, usage) => sum + usage.amount, 0);
    
    // Calculate remaining amount
    const remainingAmount = totalCollected - totalUsed;
    
    // Update the display
    document.getElementById('totalCollectedAmount').textContent = totalCollected.toFixed(2);
    document.getElementById('totalUsedAmount').textContent = totalUsed.toFixed(2);
    document.getElementById('remainingAmount').textContent = remainingAmount.toFixed(2);
}

// Calculate and display total fines collected
function updateTotalFines() {
    const totalAmount = fines
        .filter(fine => fine.status === 'paid')
        .reduce((sum, fine) => sum + fine.amount, 0);
    document.getElementById('totalFineAmount').textContent = totalAmount.toFixed(2);
}

// Handle student search form
document.getElementById('studentSearchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const studentName = document.getElementById('studentName').value.toLowerCase();
    const roomNumber = document.getElementById('roomNumber').value.toLowerCase();
    
    // Find all fines for the student
    const studentFines = fines.filter(fine => 
        fine.studentName.toLowerCase() === studentName &&
        fine.roomNumber.toLowerCase() === roomNumber
    );
    
    // Display results in modal
    const detailsDiv = document.getElementById('studentFineDetails');
    if (studentFines.length === 0) {
        detailsDiv.innerHTML = '<div class="alert alert-success">No fines found for this student.</div>';
    } else {
        let totalPending = 0;
        let html = `
            <h4>Fine Details for ${studentName} (Room: ${roomNumber})</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Reason</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        studentFines.forEach(fine => {
            if (fine.status === 'pending') {
                totalPending += fine.amount;
            }
            html += `
                <tr>
                    <td>${fine.date}</td>
                    <td>${fine.reason}</td>
                    <td>₹${fine.amount.toFixed(2)}</td>
                    <td><span class="badge bg-${fine.status === 'paid' ? 'success' : fine.status === 'pending' ? 'warning' : 'danger'}">${fine.status}</span></td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <div class="alert alert-${totalPending > 0 ? 'warning' : 'success'}">
                <strong>Total Pending Amount: ₹${totalPending.toFixed(2)}</strong>
            </div>
        `;
        
        detailsDiv.innerHTML = html;
    }
    
    // Show modal
    new bootstrap.Modal(document.getElementById('fineDetailsModal')).show();
});

// Update total fines when page loads
updateTotalFines();

// Call updateFinancialSummary when the page loads
document.addEventListener('DOMContentLoaded', updateFinancialSummary);
