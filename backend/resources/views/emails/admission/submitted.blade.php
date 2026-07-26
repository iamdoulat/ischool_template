@component('mail::message')
# Admission Application Submitted

Dear {{ $admission->first_name }},

Thank you for applying to our school. Your application has been successfully submitted.

**Reference Number:** {{ $admission->reference_no }}
**Class:** {{ $admission->schoolClass->name }}
**Section:** {{ $admission->section->name }}

Please keep this reference number for future communication. You can use it to track your application status.

@component('mail::button', ['url' => config('app.url') . '/online_admission?ref=' . $admission->reference_no])
Track Application
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
