package models

// Holiday represents a single public or bank holiday entry.
type Holiday struct {
	ID       int    `json:"id"`
	Day      string `json:"day"`
	Date     string `json:"date"`
	Year     int    `json:"year"`
	Occasion string `json:"occasion"`
}
