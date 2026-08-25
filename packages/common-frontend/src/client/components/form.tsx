import React, { CSSProperties } from 'react';

import { Form as FormikForm, Formik, FormikValues } from 'formik';

export interface FormProps {
    initialValues: FormikValues;
    onSubmit: (values: FormikValues, setSubmitting: (arg0: boolean) => void) => void;
    validationSchema?: unknown;

    // Formik validates on blur by default, which reports a field as missing as
    // soon as it is left empty. Pass false where a field is only wrong once it
    // is submitted.
    validateOnBlur?: boolean;

    // `ReactNode` has included arrays since React 18's types; `ReactNodeArray`
    // was the deprecated alias for that half and is gone in React 19's.
    children: React.ReactNode;

    className?: string;
    style?: CSSProperties;
}


const Form: React.FunctionComponent<FormProps> = (props: FormProps) => {
    return <div className={props.className} style={props.style}>
        <Formik initialValues={props.initialValues}
                validationSchema={props.validationSchema}
                validateOnBlur={props.validateOnBlur ?? true}
                onSubmit={(values, { setSubmitting, resetForm }) => {
                  props.onSubmit(values, setSubmitting);
                  resetForm()
                }}>
            <FormikForm>
                {props.children}
            </FormikForm>
        </Formik>
    </div>;
};

export default Form;
