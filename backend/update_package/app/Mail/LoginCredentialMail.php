<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginCredentialMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $username,
        public string $admissionNo,
        public string $password,
        public string $schoolName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Login Credentials - ' . $this->schoolName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.credentials',
        );
    }
}
