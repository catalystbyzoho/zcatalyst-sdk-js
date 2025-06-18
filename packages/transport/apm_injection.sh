#!/bin/sh

mkdir -p apminsight
echo "downloading & extracting apm agent..."
curl https://build.zohocorp.com/me/apm_insight_agent_nodejs/milestones/channel1/apm_insight_agent_catalyst_nodejs.zip --output apm.zip && unzip apm.zip
echo "injecting files to apminsight"
cp -a agent_minified/. apminsight/
echo "cleaning up..."
rm -rf apm.zip agent_minified
echo "injection completed"