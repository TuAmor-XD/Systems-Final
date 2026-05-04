package helpers

import (
	"encoding/json"
	"log"
	"net/http"
)

// Envelope is the standard JSON wrapper for every response.
// e.g. {"holidays": [...]} or {"error": "..."}
type Envelope map[string]any

// WriteJSON marshals data into indented JSON and writes it to the response.
func WriteJSON(w http.ResponseWriter, status int, data Envelope, headers http.Header) error {
	js, err := json.MarshalIndent(data, "", "\t")
	if err != nil {
		return err
	}
	js = append(js, '\n')

	for key, values := range headers {
		for _, v := range values {
			w.Header().Add(key, v)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, err = w.Write(js)
	return err
}

// ServerError logs the internal error and returns a generic 500 JSON response.
func ServerError(w http.ResponseWriter, err error) {
	log.Printf("ERROR: %v", err)
	WriteJSON(w, http.StatusInternalServerError, Envelope{
		"error": "the server encountered a problem and could not process your request",
	}, nil)
}

// NotFound returns a 404 JSON response.
func NotFound(w http.ResponseWriter) {
	WriteJSON(w, http.StatusNotFound, Envelope{
		"error": "the requested resource could not be found",
	}, nil)
}

// BadRequest returns a 400 JSON response.
func BadRequest(w http.ResponseWriter, msg string) {
	WriteJSON(w, http.StatusBadRequest, Envelope{"error": msg}, nil)
}
