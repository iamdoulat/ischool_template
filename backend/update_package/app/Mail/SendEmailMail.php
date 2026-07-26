<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class SendEmailMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $subjectText;
    public string $messageBody;
    public ?string $attachmentPath;

    public function __construct(string $subject, string $message, ?string $attachmentPath = null)
    {
        $this->subjectText = $subject;
        $this->messageBody = $message;
        $this->attachmentPath = $attachmentPath;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectText,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.send-email',
            with: [
                'subject' => $this->subjectText,
                'messageBody' => $this->messageBody,
            ],
        );
    }

    public function attachments(): array
    {
        if (!$this->attachmentPath || !Storage::exists($this->attachmentPath)) {
            return [];
        }

        $fullPath = Storage::path($this->attachmentPath);

        return [
            Attachment::fromPath($fullPath),
        ];
    }
}
