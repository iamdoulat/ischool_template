<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $token,
        public string $email,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Your Password - iSchool',
        );
    }

    public function content(): Content
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        return new Content(
            view: 'emails.reset-password',
            with: [
                'resetLink' => $frontendUrl . '/reset-password?token=' . $this->token . '&email_or_username=' . urlencode($this->email),
            ],
        );
    }
}
