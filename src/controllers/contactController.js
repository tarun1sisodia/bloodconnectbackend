const { supabase } = require('../utils/supabase');

// Submit contact form
exports.createContact = async (req, res) => {
    try {
        // Ensure user is authenticated (this is already handled by auth middleware)
        const { name, email, subject, message } = req.body;

        // Validate input
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('contact_messages')
            .insert({
                user_id: req.supabaseUser.id,
                name,
                email,
                subject,
                message,
                status: 'unread'
            });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ message: 'Failed to submit contact form' });
        }

        // Return success response
        res.status(201).json({
            message: 'Contact form submitted successfully',
            data
        });
    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
