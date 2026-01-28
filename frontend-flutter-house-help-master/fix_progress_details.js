const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib', 'screens', 'service_request_in_progress_screen.dart');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Find the start and end of _buildProgressDetails() method
const startStr = 'Widget _buildProgressDetails() {';
const endStr = 'Widget _buildNextStep';
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find _buildProgressDetails method');
    process.exit(1);
}

// Extract the current method
const currentMethod = content.slice(startIndex, endIndex);

// New method implementation
const newMethod = `Widget _buildProgressDetails() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'What happens next',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
          ),
          const SizedBox(height: 12),
          if (_status == AssignmentStatus.assigned) ...[
            _buildNextStep(
              context,
              icon: Icons.assignment,
              text: 'Your booking is being prepared',
            ),
            const SizedBox(height: 8),
            _buildNextStep(
              context,
              icon: Icons.payment,
              text: 'You’ll be asked to confirm and complete payment',
            ),
            const SizedBox(height: 8),
            _buildNextStep(
              context,
              icon: Icons.check_circle,
              text: 'We’ll take care of the rest',
            ),
          ] else ...[
            _buildNextStep(
              context,
              icon: Icons.person,
              text: 'We assign a verified professional',
            ),
            const SizedBox(height: 8),
            _buildNextStep(
              context,
              icon: Icons.notifications,
              text: 'You’ll be notified once assigned',
            ),
            const SizedBox(height: 8),
            _buildNextStep(
              context,
              icon: Icons.payment,
              text: 'Payment will be requested after assignment',
            ),
          ],
        ],
      ),
    );
  }
`;

// Replace the old method with the new one
const fixedContent = content.slice(0, startIndex) + newMethod + content.slice(endIndex);

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent, 'utf8');

console.log('Successfully updated _buildProgressDetails() method');
