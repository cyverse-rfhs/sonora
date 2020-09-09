import React from "react";

import { withKnobs, boolean } from "@storybook/addon-knobs";

import { mockAxios } from "../axiosMock";

import OpsBag, {
    FILE_TYPE,
    FOLDER_TYPE,
    ANALYSIS_TYPE,
    APP_TYPE,
} from "../../src/components/OpsBag";

export default {
    title: "Bags/OpsBag",
    decorators: [withKnobs],
};

const data = {
    items: [
        {
            name: "test file 1",
            path: "/test/path/1",
            type: FILE_TYPE,
        },
        {
            name: "test folder 1",
            path: "/test/folder/1",
            type: FOLDER_TYPE,
        },
        {
            name: "test analysis 1",
            type: ANALYSIS_TYPE,
        },
        { name: "test app 1", type: APP_TYPE },
    ],
};

export const TestOpsBag = () => {
    const open = boolean("Open", true);
    mockAxios.onGet("/api/bags/default").reply(200, data);

    return <OpsBag open={open} remove={() => {}} />;
};
