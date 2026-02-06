<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->register(\Illuminate\View\ViewServiceProvider::class);

        if (! $this->app->bound('view')) {
            $this->app->singleton('view', function () {
                return new class {
                    public function replaceNamespace($namespace, $hints): void
                    {
                        // No-op view replacement for API-only runtime.
                    }
                };
            });
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
