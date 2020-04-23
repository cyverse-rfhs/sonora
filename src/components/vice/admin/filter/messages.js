import common from "../messages";

export default {
    locales: common.locales,
    messages: {
        ...common.messages,
        image: "Image",
        port: "Port",
        uid: "UID",
        gid: "GID",
        command: "Command",
        name: "Name",
        nodePort: "Node Port",
        targetPort: "Target Port",
        targetPortName: "Target Port Name",
        protocol: "Protocol",
        namespace: "Namespace",
        portName: "Port Name",
        analysisName: "Analysis Name",
        appName: "App Name",
        appID: "App ID",
        externalID: "External ID",
        userID: "User ID",
        username: "Username",
        dateCreated: "Date Created",
        analyses: "Analyses",
        deployments: "Deployments",
        services: "Services",
        configMaps: "ConfigMaps",
        ingresses: "Ingresses",
        pods: "Pods",
        phase: "Phase",
        message: "Message",
        reason: "Reason",
    },
};
