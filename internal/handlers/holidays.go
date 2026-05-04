package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/TuAmor-XD/Systems-Project/internal/helpers"
	"github.com/TuAmor-XD/Systems-Project/internal/models"
)

// Application holds the shared database connection.
type Application struct {
	DB *sql.DB
}

// scanHolidays is a small helper that scans all rows from a query into a
// slice of Holiday structs. Every handler that returns a list uses this
// so we don't repeat the same rows.Next() / rows.Scan() / rows.Err() block.
func scanHolidays(rows *sql.Rows) ([]models.Holiday, error) {
	var holidays []models.Holiday
	for rows.Next() {
		var h models.Holiday
		err := rows.Scan(&h.ID, &h.Day, &h.Date, &h.Year, &h.Occasion)
		if err != nil {
			return nil, err
		}
		holidays = append(holidays, h)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return holidays, nil
}

// GET /holidays/month/current
// Returns all holidays in the current calendar month.
func (app *Application) HolidaysThisMonth(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	month := int(now.Month())
	year := now.Year()

	rows, err := app.DB.Query(`
		SELECT id, day, date, year, occasion
		FROM holidays
		WHERE year = $1 AND EXTRACT(MONTH FROM date) = $2
		ORDER BY date`, year, month)
	if err != nil {
		helpers.ServerError(w, err)
		return
	}
	defer rows.Close()

	holidays, err := scanHolidays(rows)
	if err != nil {
		helpers.ServerError(w, err)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, helpers.Envelope{"holidays": holidays}, nil)
}

// GET /holidays/month/next
// Returns all holidays in the next calendar month.
func (app *Application) HolidaysNextMonth(w http.ResponseWriter, r *http.Request) {
	now := time.Now().AddDate(0, 1, 0)
	month := int(now.Month())
	year := now.Year()

	rows, err := app.DB.Query(`
		SELECT id, day, date, year, occasion
		FROM holidays
		WHERE year = $1 AND EXTRACT(MONTH FROM date) = $2
		ORDER BY date`, year, month)
	if err != nil {
		helpers.ServerError(w, err)
		return
	}
	defer rows.Close()

	holidays, err := scanHolidays(rows)
	if err != nil {
		helpers.ServerError(w, err)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, helpers.Envelope{"holidays": holidays}, nil)
}

// GET /holidays/occasions
// Returns a list of all occasion names for the year.
func (app *Application) AllOccasions(w http.ResponseWriter, r *http.Request) {
	rows, err := app.DB.Query(`
		SELECT occasion FROM holidays
		ORDER BY date`)
	if err != nil {
		helpers.ServerError(w, err)
		return
	}
	defer rows.Close()

	var occasions []string
	for rows.Next() {
		var o string
		if err := rows.Scan(&o); err != nil {
			helpers.ServerError(w, err)
			return
		}
		occasions = append(occasions, o)
	}

	helpers.WriteJSON(w, http.StatusOK, helpers.Envelope{"occasions": occasions}, nil)
}

// GET /holidays/dates
// Returns a list of all holiday dates for the year.
func (app *Application) AllDates(w http.ResponseWriter, r *http.Request) {
	rows, err := app.DB.Query(`
		SELECT TO_CHAR(date, 'FMDDth Month YYYY') FROM holidays
		ORDER BY date`)
	if err != nil {
		helpers.ServerError(w, err)
		return
	}
	defer rows.Close()

	var dates []string
	for rows.Next() {
		var d string
		if err := rows.Scan(&d); err != nil {
			helpers.ServerError(w, err)
			return
		}
		dates = append(dates, d)
	}

	helpers.WriteJSON(w, http.StatusOK, helpers.Envelope{"dates": dates}, nil)
}

// GET /holidays/days
// Returns a list of all weekday names (Monday, Tuesday…) for each holiday.
func (app *Application) AllDays(w http.ResponseWriter, r *http.Request) {
	rows, err := app.DB.Query(`
		SELECT day FROM holidays
		ORDER BY date`)
	if err != nil {
		helpers.ServerError(w, err)
		return
	}
	defer rows.Close()

	var days []string
	for rows.Next() {
		var d string
		if err := rows.Scan(&d); err != nil {
			helpers.ServerError(w, err)
			return
		}
		days = append(days, d)
	}

	helpers.WriteJSON(w, http.StatusOK, helpers.Envelope{"days": days}, nil)
}

// GET /holidays/today
// Returns whether today is a holiday, the occasion if it is, and a message.
func (app *Application) IsHolidayToday(w http.ResponseWriter, r *http.Request) {
	today := time.Now().Format("2006-01-02")

	var occasion string
	err := app.DB.QueryRow(`
		SELECT occasion FROM holidays
		WHERE date = $1`, today).Scan(&occasion)

	if err != nil && err != sql.ErrNoRows {
		helpers.ServerError(w, err)
		return
	}

	if err == sql.ErrNoRows {
		helpers.WriteJSON(w, http.StatusOK, helpers.Envelope{
			"is_holiday": false,
			"occasion":   nil,
			"message":    "I know you need a break, but hold on a bit longer.",
		}, nil)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, helpers.Envelope{
		"is_holiday": true,
		"occasion":   occasion,
		"message":    "Congratulations! You deserve a break. Enjoy " + occasion + "!",
	}, nil)
}

// GET /holidays/next
// Returns the next upcoming holiday after today.
func (app *Application) NextHoliday(w http.ResponseWriter, r *http.Request) {
	today := time.Now().Format("2006-01-02")

	var h models.Holiday
	err := app.DB.QueryRow(`
		SELECT id, day, date, year, occasion
		FROM holidays
		WHERE date > $1
		ORDER BY date
		LIMIT 1`, today).Scan(&h.ID, &h.Day, &h.Date, &h.Year, &h.Occasion)

	if err != nil {
		if err == sql.ErrNoRows {
			helpers.WriteJSON(w, http.StatusOK, helpers.Envelope{
				"message": "No more holidays this year. See you in 2027!",
			}, nil)
			return
		}
		helpers.ServerError(w, err)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, helpers.Envelope{"next_holiday": h}, nil)
}

// GET /holidays/year/{year}
// Returns all holidays for the given year.
// Only 2026 is supported since that is all that is in the database.
func (app *Application) HolidaysByYear(w http.ResponseWriter, r *http.Request) {
	yearStr := r.PathValue("year")
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		helpers.BadRequest(w, "year must be a number")
		return
	}

	if year != 2026 {
		helpers.BadRequest(w, "only 2026 is supported. We only have holidays data for 2026.")
		return
	}

	rows, err := app.DB.Query(`
		SELECT id, day, date, year, occasion
		FROM holidays
		WHERE year = $1
		ORDER BY date`, year)
	if err != nil {
		helpers.ServerError(w, err)
		return
	}
	defer rows.Close()

	holidays, err := scanHolidays(rows)
	if err != nil {
		helpers.ServerError(w, err)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, helpers.Envelope{"holidays": holidays}, nil)
}
