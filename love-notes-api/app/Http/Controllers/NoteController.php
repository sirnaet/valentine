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
