#!/usr/bin/env python3
"""Generate PDF using reportlab (usually pre-installed)."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, 
                                 Table, TableStyle, PageBreak, Preformatted)
from reportlab.lib.enums import TA_CENTER

output_path = "/home/team/shared/DEPLOY_GUIDE.pdf"

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    topMargin=2*cm,
    bottomMargin=2*cm,
    leftMargin=2*cm,
    rightMargin=2*cm,
)

styles = getSampleStyleSheet()

# Custom styles
styles.add(ParagraphStyle(
    'CoverTitle', parent=styles['Title'],
    fontSize=28, textColor=HexColor('#4f46e5'),
    spaceAfter=6, alignment=TA_CENTER
))
styles.add(ParagraphStyle(
    'CoverSub', parent=styles['Normal'],
    fontSize=14, textColor=HexColor('#64748b'),
    alignment=TA_CENTER, spaceAfter=40
))
styles.add(ParagraphStyle(
    'SectionHead', parent=styles['Heading1'],
    fontSize=18, textColor=HexColor('#4338ca'),
    spaceBefore=20, spaceAfter=10,
    borderWidth=0, borderPadding=0,
))
styles.add(ParagraphStyle(
    'StepHead', parent=styles['Heading2'],
    fontSize=14, textColor=HexColor('#3730a3'),
    spaceBefore=14, spaceAfter=6,
))
styles.add(ParagraphStyle(
    'SubHead', parent=styles['Heading3'],
    fontSize=12, textColor=HexColor('#4f46e5'),
    spaceBefore=10, spaceAfter=4,
))
styles.add(ParagraphStyle(
    'Body', parent=styles['Normal'],
    fontSize=10, leading=14,
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    'Code', parent=styles['Code'],
    fontSize=8, backColor=HexColor('#f1f5f9'),
    borderPadding=6,
))

def code(text):
    return Preformatted(text, styles['Code'])

def bold(text):
    return f'<b>{text}</b>'

story = []

# Cover page
story.append(Spacer(1, 120))
story.append(Paragraph("Douglas Real Estate Systems", styles['CoverTitle']))
story.append(Paragraph("Deployment Guide", styles['CoverSub']))
story.append(Spacer(1, 20))
story.append(Paragraph("Live demo ready in ~10 minutes", 
    ParagraphStyle('Small', parent=styles['Normal'], fontSize=10, 
                   textColor=HexColor('#94a3b8'), alignment=TA_CENTER)))
story.append(PageBreak())

# Section 1: Prerequisites
story.append(Paragraph("Prerequisites", styles['SectionHead']))
story.append(Paragraph("Before starting, make sure you have:", styles['Body']))
story.append(Paragraph("• A GitHub account (code is at <b>github.com/thebbd1968-cmd/Netlify</b>)", styles['Body']))
story.append(Paragraph("• A Netlify account (free at app.netlify.com)", styles['Body']))
story.append(Paragraph("• A Render account (free at render.com)", styles['Body']))
story.append(Spacer(1, 10))

# Step 1
story.append(Paragraph("Step 1: Deploy the Backend (Render)", styles['StepHead']))
story.append(Paragraph("Time: ~5 minutes", ParagraphStyle('Time', parent=styles['Normal'], fontSize=9, textColor=HexColor('#94a3b8'))))
story.append(Paragraph("1. Go to render.com and sign up / log in", styles['Body']))
story.append(Paragraph("2. Click Dashboard → New → Blueprint", styles['Body']))
story.append(Paragraph("3. Connect your GitHub account", styles['Body']))
story.append(Paragraph('4. Select the repository: <b>thebbd1968-cmd/Netlify</b>', styles['Body']))
story.append(Paragraph("5. Render auto-detects the render.yaml configuration", styles['Body']))
story.append(Paragraph("6. Click Apply and wait ~2 minutes", styles['Body']))
story.append(Paragraph("<b>Backend URL:</b> https://douglas-re-backend.onrender.com", styles['Body']))
story.append(Spacer(1, 10))

# Step 2
story.append(Paragraph("Step 2: Deploy the Frontend (Netlify)", styles['StepHead']))
story.append(Paragraph("Time: ~5 minutes", ParagraphStyle('Time2', parent=styles['Normal'], fontSize=9, textColor=HexColor('#94a3b8'))))
story.append(Paragraph("1. Go to app.netlify.com and sign up / log in", styles['Body']))
story.append(Paragraph("2. Click Add new site → Import existing project", styles['Body']))
story.append(Paragraph("3. Connect your GitHub and select the same repo", styles['Body']))
story.append(Paragraph("4. Netlify auto-detects the netlify.toml config", styles['Body']))
story.append(Paragraph("5. Click Deploy site and wait ~1 minute", styles['Body']))
story.append(Paragraph("<b>Frontend URL:</b> https://[your-site].netlify.app", styles['Body']))
story.append(Paragraph("<i>Tip: Customize the URL in Netlify → Site settings → Change site name</i>", styles['Body']))
story.append(Spacer(1, 10))

# Step 3
story.append(Paragraph("Step 3: Log In & Demo", styles['StepHead']))
story.append(Paragraph("Open your Netlify URL in any browser and log in:", styles['Body']))

login_data = [
    ['Role', 'Email', 'Password'],
    ['Agent', 'agent@douglasre.com', 'password123'],
    ['Investor', 'investor@douglasre.com', 'password123'],
]
login_table = Table(login_data, colWidths=[100, 200, 150])
login_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#4f46e5')),
    ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
    ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8fafc')),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('LEFTPADDING', (0, 0), (-1, -1), 12),
]))
story.append(login_table)
story.append(Spacer(1, 10))

# Features
story.append(Paragraph("Demo Features", styles['StepHead']))
features_data = [
    ['Feature', 'Description'],
    ['Dashboard', 'Live stats, pipeline summary, recent deals'],
    ['Contacts CRM', 'Lead tracking with status badges, budgets'],
    ['Properties', 'Card grid with one-click analysis'],
    ['Deal Pipeline', '5-stage kanban: Lead → Closed'],
    ['Tasks', 'Kanban board with priority indicators'],
    ['Portfolios', 'Investor dashboard with cash flow'],
    ['Auto-Nurture', 'Follow-up sequences with templates'],
    ['Reports', 'GCI tracking and full dashboard summary'],
]
feat_table = Table(features_data, colWidths=[120, 320])
feat_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#4f46e5')),
    ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
    ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8fafc')),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
]))
story.append(feat_table)
story.append(Spacer(1, 10))

# Viktor API
story.append(Paragraph("Viktor Integration Endpoints", styles['StepHead']))
story.append(Paragraph("Available once deployed:", styles['Body']))
viktor_data = [
    ['Endpoint', 'Purpose'],
    ['POST /tools/analyze-and-draft', 'Analysis + drafted email/SMS'],
    ['POST /webhooks/viktor/event', 'Receive events from Viktor'],
    ['POST /nurture/check-triggers', 'Check follow-up triggers'],
    ['POST /nurture/send', 'Log sent follow-up'],
]
viktor_table = Table(viktor_data, colWidths=[200, 240])
viktor_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#4f46e5')),
    ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
    ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8fafc')),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
]))
story.append(viktor_table)
story.append(Paragraph('Set env vars: VIKTOR_WEBHOOK_URL, VIKTOR_WEBHOOK_SECRET, JWT_SECRET', 
    ParagraphStyle('Note', parent=styles['Normal'], fontSize=9, textColor=HexColor('#64748b'))))

# Build PDF
doc.build(story)
print(f"PDF created: {output_path}")
size = os.path.getsize(output_path)
print(f"Size: {size} bytes ({size/1024:.1f} KB)")