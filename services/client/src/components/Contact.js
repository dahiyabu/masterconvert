import React, { useState } from 'react';
import './Contact.css'; // Externalize the CSS for better maintainability

const ContactPage = ({API_URL}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show a basic loading state or disable the button if needed
  
    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      // Optional: check for a success field in the response
      const data = await response.json();
      console.log('Server response:', data);
  
      // Reset form & show success
      setShowSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
  
      // Scroll to top or success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
  
      // Hide the message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
  
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert('There was a problem sending your message. Please try again later.');
    }
  };
  

  return (
    <div className="container-contact">
      <div className="header">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you! Send us your feedback, questions, or suggestions.</p>
      </div>

      <div className="form-container">
        {showSuccess && (
          <div className="success-message">
            <span className="emoji">✅</span>
            Thank you for your message! We'll get back to you soon.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName"><span className="emoji">👤</span>First Name <span className="required">*</span></label>
              <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="lastName"><span className="emoji">👤</span>Last Name <span className="required">*</span></label>
              <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email"><span className="emoji">📧</span>Email Address <span className="required">*</span></label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="phone"><span className="emoji">📱</span>Phone Number</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="subject"><span className="emoji">📝</span>Subject <span className="required">*</span></label>
            <select id="subject" name="subject" value={formData.subject} onChange={handleChange} required>
              <option value="">Select a subject...</option>
              <option value="general">General Inquiry</option>
              <option value="feedback">Feedback</option>
              <option value="support">Technical Support</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message"><span className="emoji">💬</span>Message <span className="required">*</span></label>
            <textarea id="message" name="message" value={formData.message} onChange={handleChange} required placeholder="Please share your thoughts, questions, or feedback..."></textarea>
          </div>

          <button type="submit" className="submit-btn">
            <span className="emoji">🚀</span>Send Message
          </button>
        </form>

        <div className="contact-info">
          <h3><span className="emoji">📞</span>Get in Touch</h3>
          <p><strong>Email:</strong> support@extConvert.com</p>
          {/*<p><strong>Phone:</strong> +1 (555) 123-4567</p>
          <p><strong>Address:</strong> 123 Business St, Suite 100, City, State 12345</p>
          <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST</p>*/}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;