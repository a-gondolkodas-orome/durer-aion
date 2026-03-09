import React, { CSSProperties } from 'react';

import { Form as FormikForm, Formik, FormikValues } from 'formik';

export interface FormProps {
    initialValues: any;
    onSubmit: (values: FormikValues, setSubmitting: (arg0: boolean) => void) => void;
    validationSchema?: any;

    children: React.ReactNode | React.ReactNodeArray;

    className?: string;
    style?: CSSProperties;
}


const Form: React.FunctionComponent<FormProps> = (props: FormProps) => {
    return <div className={props.className} style={props.style}>
        <Formik initialValues={props.initialValues}
                validationSchema={props.validationSchema}
                onSubmit={(values, { setSubmitting, setTouched, resetForm }) => {
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
