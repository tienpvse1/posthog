import React from 'react'
import { useActions, useValues } from 'kea'
import { CardContainer } from 'scenes/ingestion/CardContainer'
import { Button, Col, Row } from 'antd'
import { ingestionLogic } from 'scenes/ingestion/ingestionLogic'
import { APP, BOOKMARKLET, platforms } from 'scenes/ingestion/constants'
import { PlatformType } from 'scenes/ingestion/types'
import { LemonButton } from 'lib/components/LemonButton'
import posthogLogo from 'public/posthog-logo.png'
import { Link } from 'lib/components/Link'
import './Panels.scss'

export function PlatformPanel(): JSX.Element {
    const { setPlatform } = useActions(ingestionLogic)
    const { index, onboarding1 } = useValues(ingestionLogic)

    return (
        <>
            {onboarding1 ? (
                <div style={{ minWidth: 300, width: '30vw' }}>
                    <Row justify="center">
                        <img src={posthogLogo} style={{ width: 157, height: 30 }} />
                    </Row>
                    <div className="welcome-panel">
                        <h1>Welcome to PostHog</h1>
                        <p className="fw-500">
                            First things first, where do you want to deploy PostHog? Or you can import existing data, if
                            you prefer.
                        </p>
                        <Col>
                            {platforms.map((platform) => (
                                <LemonButton
                                    key={platform}
                                    fullWidth
                                    center
                                    type="primary"
                                    className="platform-btn"
                                    onClick={() => setPlatform(platform)}
                                >
                                    {platform}
                                </LemonButton>
                            ))}
                            <LemonButton
                                onClick={() => setPlatform(APP)}
                                fullWidth
                                center
                                type="primary"
                                className="platform-btn"
                            >
                                {APP}
                            </LemonButton>
                            <LemonButton
                                type="secondary"
                                fullWidth
                                center
                                onClick={() => setPlatform(BOOKMARKLET)}
                                style={{ color: 'black', borderColor: 'black' }}
                            >
                                {BOOKMARKLET}
                            </LemonButton>
                        </Col>
                        <Row justify="center" className="visit-support">
                            <p style={{ marginBottom: 0 }}>
                                Have questions? <Link>Visit support</Link>
                            </p>
                        </Row>
                    </div>
                </div>
            ) : (
                <CardContainer index={index}>
                    <h1>Welcome to PostHog</h1>
                    <p className="prompt-text">
                        Let's get you up and running with PostHog! What type of platform is your app? (You can connect
                        to multi-deployments later)
                    </p>
                    <Row>
                        {platforms.map((platform) => (
                            <Button
                                type="primary"
                                data-attr={'select-platform-' + platform}
                                key={platform}
                                style={{ marginRight: 10 }}
                                onClick={() => setPlatform(platform as PlatformType)}
                            >
                                {platform}
                            </Button>
                        ))}
                    </Row>
                </CardContainer>
            )}
        </>
    )
}
