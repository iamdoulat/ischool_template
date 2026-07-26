<?php

namespace App\Http\Controllers\Api\v1\FrontCms;

use App\Http\Controllers\Api\BaseController;
use App\Mail\ContactFormMail;
use App\Models\GeneralSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactFormController extends BaseController
{
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'mobile' => 'nullable|string|max:50',
            'details' => 'required|string',
        ]);

        $settings = GeneralSetting::first();
        $receiverEmail = $settings?->contact_form_receiver_email;

        if (!$receiverEmail) {
            return $this->error('No receiver email configured', 400);
        }

        Mail::to($receiverEmail)->send(new ContactFormMail(
            $validated['name'],
            $validated['email'],
            $validated['mobile'] ?? '',
            $validated['details'],
        ));

        return $this->success(null, 'Your message has been sent successfully.');
    }
}
