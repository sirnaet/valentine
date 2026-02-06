# Laravel Notes API Setup

This frontend now reads/writes notes from:

- `GET /api/notes`
- `POST /api/notes`

Use the Laravel files below in a Laravel project.

## 1. Create model + migration + controller

```bash
php artisan make:model Note -m
php artisan make:controller NoteController
```

## 2. Migration

File: `database/migrations/<timestamp>_create_notes_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->string('message', 255);
            $table->string('category', 50)->default('romantic');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
```

Run:

```bash
php artisan migrate
```

## 3. Model

File: `app/Models/Note.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    use HasFactory;

    protected $fillable = ['message', 'category'];
}
```

## 4. Controller

File: `app/Http/Controllers/NoteController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Note::query()->latest()->get(['id', 'message', 'category', 'created_at'])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:romantic,cute,funny,deep,self'],
        ]);

        $note = Note::create($validated);

        return response()->json($note, 201);
    }
}
```

## 5. API routes

File: `routes/api.php`

```php
<?php

use App\Http\Controllers\NoteController;
use Illuminate\Support\Facades\Route;

Route::get('/notes', [NoteController::class, 'index']);
Route::post('/notes', [NoteController::class, 'store']);
```

## 6. CORS (if frontend is served on another port)

If your frontend runs at `http://127.0.0.1:5500` and Laravel at `http://127.0.0.1:8000`,
update `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://127.0.0.1:5500', 'http://localhost:5500'],
'allowed_headers' => ['*'],
```

Then clear config cache:

```bash
php artisan config:clear
```

## 7. Start Laravel

```bash
php artisan serve
```

## 8. Frontend API base URL

`script.js` supports:

- same-origin API: leave default
- different origin: set `window.NOTES_API_BASE` before loading `script.js`

Example in `index.html`:

```html
<script>
  window.NOTES_API_BASE = "http://127.0.0.1:8000";
</script>
<script src="script.js"></script>
```
