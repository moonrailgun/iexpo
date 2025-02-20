"use client";

import { useEffect, useState } from "react";
import { jsonServerProvider, Resource, Tushan, LoadingView } from "tushan";
import { useSession } from "next-auth/react";
import { IconCompass } from "tushan/client/icon";
import React from "react";
import { DeploymentCreate } from "./route/DeploymentCreate";
import { DeploymentList } from "./route/DeploymentList";
import { ClientRedirect } from "../Redirect";

const dataProvider = jsonServerProvider("/api/admin");

export const Admin = React.memo(() => {
  const [isClient, setIsClient] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  if (status === "loading") {
    return <LoadingView />;
  }

  if (status === "unauthenticated") {
    return <ClientRedirect to="/" />;
  }

  return (
    <Tushan basename="/admin" dataProvider={dataProvider}>
      <Resource
        name="deployment"
        label="Deployment"
        icon={<IconCompass />}
        list={<DeploymentList />}
        create={<DeploymentCreate />}
      />
    </Tushan>
  );
});
Admin.displayName = "AdminRoot";
