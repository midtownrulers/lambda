export interface TypeformRefField {
    id: string
    ref: string
}

export interface TypeformField extends TypeformRefField {
    title: string
    properties: object
}

export interface TypeformEmailField extends TypeformField {
    type: "email"
}

export interface TypeformPaymentField extends TypeformField {
    type: "payment"
}

export interface TypeformRefEmailField extends TypeformRefField {
    type: "email"
}

export interface TypeformRefPaymentField extends TypeformRefField {
    type: "payment"
}

export interface TypeformAnswer {
    field: TypeformRefField
}

export interface TypeformEmailAnswer extends TypeformAnswer {
    type: "email"
    email: string
}

export interface TypeformPaymentAnswer extends TypeformAnswer {
    type: "payment"
    payment: {
        amount: number
        last4: number
        name: string
        success: boolean
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
        definition: {
            id: string
            title: string
            fields: [TypeformField]
        }
        answers: [TypeformAnswer]
    }
}