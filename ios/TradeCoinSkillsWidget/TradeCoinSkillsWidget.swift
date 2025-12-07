//
//  TradeCoinSkillsWidget.swift
//  TradeCoinSkillsWidget
//
//  Created for Trade Coin Skills Widget Extension
//

import WidgetKit
import SwiftUI

// MARK: - Widget Data Model
struct PortfolioData: Codable {
    let totalPortfolioValue: Double
    let usdtBalance: Double
    let totalPnl: Double
    let totalPnlPercentage: Double
    let winRate: Double
    let globalRank: Int?
    let totalTrades: Int
    let username: String
    let avatarEmoji: String?
    let lastUpdated: Date
    
    static var placeholder: PortfolioData {
        PortfolioData(
            totalPortfolioValue: 100000.0,
            usdtBalance: 50000.0,
            totalPnl: 0.0,
            totalPnlPercentage: 0.0,
            winRate: 0.0,
            globalRank: nil,
            totalTrades: 0,
            username: "Trader",
            avatarEmoji: "🚀",
            lastUpdated: Date()
        )
    }
}

// MARK: - Widget Timeline Entry
struct PortfolioEntry: TimelineEntry {
    let date: Date
    let portfolio: PortfolioData
}

// MARK: - Widget Provider
struct PortfolioProvider: TimelineProvider {
    func placeholder(in context: Context) -> PortfolioEntry {
        PortfolioEntry(date: Date(), portfolio: .placeholder)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (PortfolioEntry) -> Void) {
        let entry = PortfolioEntry(date: Date(), portfolio: loadPortfolioData() ?? .placeholder)
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<PortfolioEntry>) -> Void) {
        let currentDate = Date()
        let portfolio = loadPortfolioData() ?? .placeholder
        
        let entry = PortfolioEntry(date: currentDate, portfolio: portfolio)
        
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
    
    // MARK: - Data Loading
    private func loadPortfolioData() -> PortfolioData? {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.dustindoan.tradecoinskills") else {
            return nil
        }
        
        guard let data = sharedDefaults.data(forKey: "portfolioData"),
              let portfolio = try? JSONDecoder().decode(PortfolioData.self, from: data) else {
            return nil
        }
        
        return portfolio
    }
}

// MARK: - Widget Views
struct SmallWidgetView: View {
    var entry: PortfolioEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Text(entry.portfolio.avatarEmoji ?? "🚀")
                    .font(.system(size: 24))
                Text(entry.portfolio.username)
                    .font(.headline)
                    .foregroundColor(.primary)
                Spacer()
            }
            
            Divider()
            
            // Portfolio Value
            VStack(alignment: .leading, spacing: 4) {
                Text("Portfolio Value")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(formatCurrency(entry.portfolio.totalPortfolioValue))
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
            }
            
            // PnL
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("PnL")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(formatCurrency(entry.portfolio.totalPnl))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(pnlColor(entry.portfolio.totalPnl))
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Win Rate")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text("\(String(format: "%.1f", entry.portfolio.winRate))%")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "$0"
    }
    
    private func pnlColor(_ pnl: Double) -> Color {
        if pnl > 0 {
            return .green
        } else if pnl < 0 {
            return .red
        } else {
            return .secondary
        }
    }
}

struct MediumWidgetView: View {
    var entry: PortfolioEntry
    
    var body: some View {
        HStack(spacing: 16) {
            // Left side - Main stats
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    Text(entry.portfolio.avatarEmoji ?? "🚀")
                        .font(.system(size: 32))
                    Text(entry.portfolio.username)
                        .font(.headline)
                        .foregroundColor(.primary)
                }
                
                Divider()
                
                // Portfolio Value
                VStack(alignment: .leading, spacing: 4) {
                    Text("Portfolio Value")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatCurrency(entry.portfolio.totalPortfolioValue))
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                }
                
                // PnL Row
                HStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Total PnL")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(formatCurrency(entry.portfolio.totalPnl))
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(pnlColor(entry.portfolio.totalPnl))
                        Text("\(formatPercentage(entry.portfolio.totalPnlPercentage))%")
                            .font(.caption2)
                            .foregroundColor(pnlColor(entry.portfolio.totalPnl))
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Win Rate")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text("\(String(format: "%.1f", entry.portfolio.winRate))%")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                    }
                }
            }
            
            Spacer()
            
            // Right side - Additional stats
            VStack(alignment: .trailing, spacing: 12) {
                if let rank = entry.portfolio.globalRank {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Rank")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("#\(rank)")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                }
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Total Trades")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(entry.portfolio.totalTrades)")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                }
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("USDT Balance")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatCurrency(entry.portfolio.usdtBalance))
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "$0"
    }
    
    private func formatPercentage(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return String(format: "\(sign)%.2f", value)
    }
    
    private func pnlColor(_ pnl: Double) -> Color {
        if pnl > 0 {
            return .green
        } else if pnl < 0 {
            return .red
        } else {
            return .secondary
        }
    }
}

struct LargeWidgetView: View {
    var entry: PortfolioEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Text(entry.portfolio.avatarEmoji ?? "🚀")
                    .font(.system(size: 40))
                Text(entry.portfolio.username)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                Spacer()
                if let rank = entry.portfolio.globalRank {
                    Text("#\(rank)")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                }
            }
            
            Divider()
            
            // Main Portfolio Value
            VStack(alignment: .leading, spacing: 8) {
                Text("Portfolio Value")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Text(formatCurrency(entry.portfolio.totalPortfolioValue))
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.primary)
            }
            
            // Stats Grid
            HStack(spacing: 20) {
                StatCard(
                    title: "Total PnL",
                    value: formatCurrency(entry.portfolio.totalPnl),
                    subtitle: "\(formatPercentage(entry.portfolio.totalPnlPercentage))%",
                    color: pnlColor(entry.portfolio.totalPnl)
                )
                
                StatCard(
                    title: "Win Rate",
                    value: "\(String(format: "%.1f", entry.portfolio.winRate))%",
                    subtitle: "\(entry.portfolio.totalTrades) trades",
                    color: .primary
                )
            }
            
            // Bottom Row
            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("USDT Balance")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatCurrency(entry.portfolio.usdtBalance))
                        .font(.headline)
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Last Updated")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatDate(entry.portfolio.lastUpdated))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "$0"
    }
    
    private func formatPercentage(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return String(format: "\(sign)%.2f", value)
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        return formatter.string(from: date)
    }
    
    private func pnlColor(_ pnl: Double) -> Color {
        if pnl > 0 {
            return .green
        } else if pnl < 0 {
            return .red
        } else {
            return .secondary
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Widget Entry View
struct PortfolioWidgetEntryView: View {
    var entry: PortfolioEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Main Widget
@main
struct TradeCoinSkillsWidget: Widget {
    let kind: String = "TradeCoinSkillsWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PortfolioProvider()) { entry in
            PortfolioWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Portfolio Tracker")
        .description("Track your trading portfolio performance at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Preview
#Preview(as: .systemSmall) {
    TradeCoinSkillsWidget()
} timeline: {
    PortfolioEntry(date: .now, portfolio: .placeholder)
    PortfolioEntry(date: .now, portfolio: PortfolioData(
        totalPortfolioValue: 125000.0,
        usdtBalance: 60000.0,
        totalPnl: 25000.0,
        totalPnlPercentage: 25.0,
        winRate: 65.5,
        globalRank: 42,
        totalTrades: 150,
        username: "Trader",
        avatarEmoji: "🚀",
        lastUpdated: Date()
    ))
}

