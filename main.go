package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/TuAmor-XD/Systems-Project/internal/handlers"
	_ "github.com/lib/pq"
)

func main() {
	dsn := "postgres://holidays_user:secret@localhost:5432/holidays_db?sslmode=disable"

	db, err := openDB(dsn)
	if err != nil {
		log.Fatalf("cannot open database: %v", err)
	}
	defer db.Close()

	app := &handlers.Application{DB: db}

	mux := http.NewServeMux()

	// CORS pre-flight for browser UI
	mux.HandleFunc("OPTIONS /holidays/{path...}", corsHandler)

	// All endpoints are GET only - this is a read-only API
	mux.HandleFunc("GET /holidays/month/current", withCORS(app.HolidaysThisMonth))
	mux.HandleFunc("GET /holidays/month/next", withCORS(app.HolidaysNextMonth))
	mux.HandleFunc("GET /holidays/occasions", withCORS(app.AllOccasions))
	mux.HandleFunc("GET /holidays/dates", withCORS(app.AllDates))
	mux.HandleFunc("GET /holidays/days", withCORS(app.AllDays))
	mux.HandleFunc("GET /holidays/today", withCORS(app.IsHolidayToday))
	mux.HandleFunc("GET /holidays/next", withCORS(app.NextHoliday))
	mux.HandleFunc("GET /holidays/year/{year}", withCORS(app.HolidaysByYear))

	// Serve static UI files from ui/ directory
	fileServer := http.FileServer(http.Dir("./ui"))
	mux.Handle("/", fileServer)

	log.Println("Starting server on :4000")
	log.Println()
	log.Println("  GET /holidays/month/current  — holidays this month")
	log.Println("  GET /holidays/month/next     — holidays next month")
	log.Println("  GET /holidays/occasions      — all occasions this year")
	log.Println("  GET /holidays/dates          — all holiday dates this year")
	log.Println("  GET /holidays/days           — all holiday weekdays this year")
	log.Println("  GET /holidays/today          — is today a holiday?")
	log.Println("  GET /holidays/next           — next upcoming holiday")
	log.Println("  GET /holidays/year/{year}    — all holidays for a given year (2026 only)")

	err = http.ListenAndServe(":4000", mux)
	log.Fatal(err)
}

func openDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxIdleTime(15 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = db.PingContext(ctx)
	if err != nil {
		db.Close()
		return nil, err
	}

	log.Println("Database connection pool established")
	return db, nil
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		next(w, r)
	}
}

func corsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.WriteHeader(http.StatusNoContent)
}
