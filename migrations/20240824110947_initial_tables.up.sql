CREATE TABLE IF NOT EXISTS users (
    user_id     INTEGER PRIMARY KEY NOT NULL,

    status      TEXT CHECK(status IN ('pending', 'ongoing', 'approved', 'rejected'))
                    NOT NULL,

    mark_date   DATETIME NOT NULL DEFAULT (DATETIME('now'))
);

CREATE TABLE IF NOT EXISTS interviews (
    id             INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,

    user_id        INTEGER NOT NULL,
    interviewer_id INTEGER NOT NULL,

    type           TEXT CHECK(type IN ('text', 'id')) NOT NULL,

    interview_date DATETIME NOT NULL DEFAULT (DATETIME('now')),

    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
