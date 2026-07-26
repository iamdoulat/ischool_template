<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookIssue;
use Illuminate\Database\Seeder;

class BookIssueSeeder extends Seeder
{
    public function run(): void
    {
        $books = Book::select('id', 'title')->get();

        if ($books->isEmpty()) {
            $this->command->warn('No books found — skipping BookIssueSeeder.');
            return;
        }

        $members = [
            ['member_id' => '32',  'library_card_no' => '362',   'member_type' => 'Student', 'issued_by' => 'George Jany Sharon (18097)',   'admission_no' => '18097'],
            ['member_id' => '38',  'library_card_no' => '433',   'member_type' => 'Student', 'issued_by' => 'Arpit Patel (326260)',          'admission_no' => '326260'],
            ['member_id' => '29',  'library_card_no' => '321',   'member_type' => 'Student', 'issued_by' => 'Arun Thomas (1800025)',         'admission_no' => '1800025'],
            ['member_id' => '17',  'library_card_no' => '00120', 'member_type' => 'Student', 'issued_by' => 'Devin Colmreach (18014)',       'admission_no' => '18014'],
            ['member_id' => '27',  'library_card_no' => '00125', 'member_type' => 'Student', 'issued_by' => 'Dharambir Singh (18077)',       'admission_no' => '18077'],
            ['member_id' => '43',  'library_card_no' => '674',   'member_type' => 'Staff',   'issued_by' => 'Sara William (38005)',          'admission_no' => '38005'],
        ];

        $rows = [];
        $baseDate = now()->subDays(30);

        foreach ($members as $i => $m) {
            $book = $books[$i % $books->count()];
            $issue = $baseDate->copy()->addDays($i * 2);
            $due   = $issue->copy()->addDays(14);
            
            // For the first 3 members, leave return_date as null so they show up in the "Book Due Report"
            $ret = ($i < 3) ? null : $issue->copy()->addDays(rand(7, 13))->toDateString();

            $rows[] = [
                'book_id'        => $book->id,
                'member_id'      => $m['member_id'],
                'library_card_no'=> $m['library_card_no'],
                'member_type'    => $m['member_type'],
                'admission_no'   => $m['admission_no'],
                'issued_by'      => $m['issued_by'],
                'issue_date'     => $issue->toDateString(),
                'due_date'       => $due->toDateString(),
                'return_date'    => $ret,
                'created_at'     => now(),
                'updated_at'     => now(),
            ];

            // Second borrow for some members
            if ($i % 2 === 0 && $books->count() > 1) {
                $book2 = $books[($i + 1) % $books->count()];
                $issue2 = $issue->copy()->addDays(5);
                $due2   = $issue2->copy()->addDays(14);
                // Also leave some secondary borrows as null
                $ret2   = ($i === 2) ? null : $issue2->copy()->addDays(rand(3, 10))->toDateString();
                
                $rows[] = [
                    'book_id'        => $book2->id,
                    'member_id'      => $m['member_id'],
                    'library_card_no'=> $m['library_card_no'],
                    'member_type'    => $m['member_type'],
                    'admission_no'   => $m['admission_no'],
                    'issued_by'      => $m['issued_by'],
                    'issue_date'     => $issue2->toDateString(),
                    'due_date'       => $due2->toDateString(),
                    'return_date'    => $ret2,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }
        }

        BookIssue::insert($rows);
        $this->command->info('BookIssueSeeder: inserted ' . count($rows) . ' rows.');
    }
}
