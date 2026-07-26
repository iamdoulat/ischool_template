<?php

namespace Database\Seeders;

use App\Models\PhoneCallLog;
use Illuminate\Database\Seeder;

class PhoneCallLogSeeder extends Seeder
{
    public function run(): void
    {
        $logs = [
            ['name' => 'Ravi Kumar', 'phone' => '9876543210', 'date' => '2026-07-01', 'description' => 'Enquiry about admission for Class 1', 'next_follow_up_date' => '2026-07-05', 'call_duration' => '5:30', 'note' => 'Interested in online admission', 'call_type' => 'Incoming'],
            ['name' => 'Priya Sharma', 'phone' => '9876543211', 'date' => '2026-07-01', 'description' => 'Follow-up on fee payment', 'next_follow_up_date' => null, 'call_duration' => '3:15', 'note' => 'Will pay fees tomorrow', 'call_type' => 'Outgoing'],
            ['name' => 'Amit Singh', 'phone' => '9876543212', 'date' => '2026-06-30', 'description' => 'Complaint about transport delay', 'next_follow_up_date' => '2026-07-02', 'call_duration' => '8:00', 'note' => 'Escalated to transport department', 'call_type' => 'Incoming'],
            ['name' => 'Sneha Patel', 'phone' => '9876543213', 'date' => '2026-06-30', 'description' => 'Request for TC', 'next_follow_up_date' => '2026-07-03', 'call_duration' => '4:45', 'note' => 'Will visit school for documents', 'call_type' => 'Incoming'],
            ['name' => 'Vijay Mehta', 'phone' => '9876543214', 'date' => '2026-06-29', 'description' => 'Enquiry about hostel facilities', 'next_follow_up_date' => '2026-07-01', 'call_duration' => '6:20', 'note' => 'Requested hostel tour', 'call_type' => 'Outgoing'],
        ];

        foreach ($logs as $log) {
            PhoneCallLog::create($log);
        }
    }
}
