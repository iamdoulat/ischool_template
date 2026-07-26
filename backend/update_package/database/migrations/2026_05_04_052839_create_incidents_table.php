<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->integer('point')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Seed default incidents
        DB::table('incidents')->insert([
            ['title' => 'Harassment and bullying', 'point' => -10, 'description' => 'If students report this type of behaviour, institutions will be able to monitor the individuals involved. They can then try to resolve the situation.', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Improper behaviour', 'point' => -10, 'description' => 'Improper behaviour could be observed in a staff member or another student. If the behaviour is threatening, concerning or inappropriate, the university or school will need to monitor the individual to ensure that the behaviour is not repetitive.', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Theft', 'point' => -15, 'description' => "It's important to report cases of theft on campus so that the university or school can increase security where needed. They could also consider other options to combat incidents of theft, such as lockers.", 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Student Good Behaviour', 'point' => 20, 'description' => 'Smile & have a good attitude and good behaviour.', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Respect others/property', 'point' => 10, 'description' => 'Respect others/property.', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('incidents');
    }
};
