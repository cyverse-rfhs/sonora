/**
 * Form field for editing App validator rule DoubleBelow params.
 *
 * @author psarando
 */
import React from "react";

import { FastField } from "formik";

import ids from "../../ids";

import { build as buildID, FormNumberField } from "@cyverse-de/ui-lib";

export default function DoubleBelowField(props) {
    const { baseId, fieldName, ...custom } = props;

    return (
        <FastField
            id={buildID(baseId, ids.PARAM_FIELDS.ARGUMENT_OPTION)}
            name={`${fieldName}.params.0`}
            component={FormNumberField}
            {...custom}
        />
    );
}
