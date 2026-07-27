<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\Api\v1\SystemSetting\BackupController;
use Illuminate\Http\Request;

class RunScheduledBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:run-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Executes scheduled database or full system backup based on admin settings';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting scheduled backup process...');
        
        $controller = new BackupController();
        $response = $controller->runScheduled(new Request());

        $this->info('Scheduled backup finished successfully.');
        return 0;
    }
}
