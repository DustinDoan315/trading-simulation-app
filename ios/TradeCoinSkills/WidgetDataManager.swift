//
//  WidgetDataManager.swift
//  TradeCoinSkills
//
//  Manages sharing portfolio data with the widget extension via App Groups
//

import Foundation
#if canImport(WidgetKit)
import WidgetKit
#endif
#if canImport(React)
import React
#endif

@objc(WidgetDataManager)
class WidgetDataManager: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func updateWidgetData(
    _ data: [String: Any],
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let sharedDefaults = UserDefaults(suiteName: "group.com.dustindoan.tradecoinskills") else {
      reject("ERROR", "Failed to access App Group", nil)
      return
    }
    
    do {
      let jsonData = try JSONSerialization.data(withJSONObject: data, options: [])
      sharedDefaults.set(jsonData, forKey: "portfolioData")
      sharedDefaults.synchronize()
      
      // Reload widget timelines
      #if canImport(WidgetKit)
      WidgetKit.WidgetCenter.shared.reloadAllTimelines()
      #endif
      
      resolve(true)
    } catch {
      reject("ERROR", "Failed to save widget data: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  func clearWidgetData(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let sharedDefaults = UserDefaults(suiteName: "group.com.dustindoan.tradecoinskills") else {
      reject("ERROR", "Failed to access App Group", nil)
      return
    }
    
    sharedDefaults.removeObject(forKey: "portfolioData")
    sharedDefaults.synchronize()
    
    // Reload widget timelines
    #if canImport(WidgetKit)
    WidgetKit.WidgetCenter.shared.reloadAllTimelines()
    #endif
    
    resolve(true)
  }
}

