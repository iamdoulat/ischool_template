<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('front_cms_menus', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->boolean('is_external')->default(false);
            $table->boolean('open_new_tab')->default(false);
            $table->string('url')->nullable();
            $table->string('page')->nullable();
            $table->string('type')->default('main'); // main, bottom
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('front_cms_menus');
    }
};
