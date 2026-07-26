<?php

namespace App\Mail;

use App\Models\OnlineAdmission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdmissionSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public $admission;
    public $type; // 'admin' or 'parent'

    /**
     * Create a new message instance.
     */
    public function __construct(OnlineAdmission $admission, $type = 'parent')
    {
        $this->admission = $admission;
        $this->type = $type;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = $this->type === 'admin' 
            ? "New Online Admission Application: {$this->admission->reference_no}"
            : "Admission Application Submitted - {$this->admission->reference_no}";

        return $this->subject($subject)
                    ->markdown('emails.admission.submitted');
    }
}
