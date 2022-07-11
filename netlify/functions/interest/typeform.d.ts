export interface TypeformRefField {
    id: string
    ref: string
}

export interface TypeformField extends TypeformRefField {
    title: string
    properties: object
}

export interface TypeformMultipleChoiceField extends TypeformField {
    type: "multiple_choice",
    choices: {
        id: string,
        label: string
    }[]
}

export interface TypeformRefMultipleChoiceField extends TypeformRefField {
    type: "multiple_choice"
}

export interface TypeformAnswer {
    field: TypeformRefField
}

export interface TypeformMultipleChoiceAnswer extends TypeformAnswer {
    type: "multiple_choice"
    choice: {
        label: string
    }
}

export interface TypeformResponse {
    event_id: string
    event_type: string
    form_response: {
        form_id: string
        token: string
        landed_at: string
        submitted_at: string
        hidden: {
            email: string
        }
        definition: {
            id: string
            title: string
            fields: TypeformField[],
            hidden: string[]
        }
        answers: TypeformAnswer[]
    }
}